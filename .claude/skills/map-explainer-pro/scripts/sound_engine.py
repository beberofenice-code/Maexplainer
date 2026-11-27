#!/usr/bin/env python3
"""Stage 4 of /map-explainer-pro: voiceover, word timestamps, SFX, music bed and final mix.

Outputs (in <project>/assets/audio/):
  vo.wav             documentary voiceover, all scenes placed on the final timeline
  timestamps.json    scene timing + word-level timestamps (+ resolved SFX cues) -> drives the engine
  sfx/*.wav          stereo micro-SFX: whoosh_deep, pop_marimba, paper_slide, tug_stretch,
                     border_flip, chime_reveal (synthesized, no samples needed)
  bed.wav            112 BPM curious marimba / plucked-pulse background bed
  mix.wav            VO + SFX + side-chain ducked bed, loudness-normalized to meta.lufs (-15 LUFS)

TTS providers (meta.voice.provider = auto | elevenlabs | edge | silent):
  elevenlabs  if ELEVENLABS_API_KEY is set (with-timestamps endpoint, character alignment -> words)
  edge        free fallback: edge-tts en-US-AndrewNeural with WordBoundary events
  silent      last resort (--allow-silent): estimated word timing, no voice (layout / timing work)
VO for each scene is cached by content hash, so re-running never re-spends TTS credits.

  python3 sound_engine.py projects/<slug> [--provider auto] [--allow-silent] [--no-music]
"""
from __future__ import annotations

import argparse
import asyncio
import base64
import hashlib
import json
import math
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d
from scipy.signal import butter, lfilter, sosfilt

sys.path.insert(0, str(Path(__file__).resolve().parent))
import mxp_common as mx  # noqa: E402

SR = 48000
SFX_NAMES = ["whoosh_deep", "pop_marimba", "paper_slide", "tug_stretch", "border_flip", "chime_reveal"]
RNG = np.random.default_rng(1729)  # deterministic synthesis


def log(*a):
    print("[sound]", *a, flush=True)


# =============================================================================== TTS
def ffmpeg_decode(src: Path, dst: Path, sr=SR, ch=1):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-ac", str(ch), "-ar", str(sr), "-c:a", "pcm_s16le", str(dst)], check=True)


def read_wav(path: Path) -> np.ndarray:
    sr, x = wavfile.read(path)
    x = x.astype(np.float32) / (32768.0 if x.dtype == np.int16 else 1.0)
    if sr != SR:
        raise ValueError(f"{path} has sr {sr}")
    return x


def write_wav(path: Path, x: np.ndarray):
    path.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(path, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))


class ElevenLabs:
    API = "https://api.elevenlabs.io/v1"

    def __init__(self, key, voice_cfg):
        import requests

        self.rq = requests.Session()
        self.rq.headers.update({"xi-api-key": key, "User-Agent": mx.USER_AGENT})
        self.cfg = voice_cfg
        self.voice_id = voice_cfg.get("elevenlabs_voice_id") or self._find_voice(voice_cfg.get("elevenlabs_voice", "Brian"))
        self.model = voice_cfg.get("elevenlabs_model", "eleven_multilingual_v2")

    def _find_voice(self, name):
        r = self.rq.get(f"{self.API}/voices", timeout=30)
        r.raise_for_status()
        voices = r.json()["voices"]
        prefs = [name, "Brian", "Daniel", "George", "Adam"]
        for pref in prefs:
            for v in voices:
                if v["name"].split(" - ")[0].strip().lower() == pref.lower():
                    log(f"ElevenLabs voice: {v['name']} ({v['voice_id']})")
                    return v["voice_id"]
        log(f"ElevenLabs voice: {voices[0]['name']} (fallback)")
        return voices[0]["voice_id"]

    def key(self, text, prev, nxt):
        s = json.dumps([text, prev, nxt, self.voice_id, self.model, {k: self.cfg.get(k) for k in ("stability", "similarity_boost", "style")}])
        return "el_" + hashlib.sha1(s.encode()).hexdigest()[:12]

    def synth(self, text, prev, nxt, mp3_path: Path):
        body = {
            "text": text,
            "model_id": self.model,
            "voice_settings": {
                "stability": self.cfg.get("stability", 0.45),
                "similarity_boost": self.cfg.get("similarity_boost", 0.8),
                "style": self.cfg.get("style", 0.25),
                "use_speaker_boost": True,
            },
        }
        if prev:
            body["previous_text"] = prev
        if nxt:
            body["next_text"] = nxt
        url = f"{self.API}/text-to-speech/{self.voice_id}/with-timestamps"
        r = self.rq.post(url, params={"output_format": "mp3_44100_128"}, json=body, timeout=300)
        if r.status_code == 400 and ("voice_settings" in r.text or "stability" in r.text or "previous_text" in r.text):
            log(f"model {self.model} rejected optional settings -> retrying with defaults")
            body.pop("voice_settings", None)
            body.pop("previous_text", None)
            body.pop("next_text", None)
            r = self.rq.post(url, params={"output_format": "mp3_44100_128"}, json=body, timeout=300)
        if r.status_code >= 400:
            raise RuntimeError(f"ElevenLabs {r.status_code}: {r.text[:300]}")
        d = r.json()
        mp3_path.write_bytes(base64.b64decode(d["audio_base64"]))
        al = d.get("normalized_alignment") or d.get("alignment")
        if d.get("alignment"):
            al = d["alignment"]  # original characters keep accents/punctuation for subtitles
        return chars_to_words(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"])


def chars_to_words(chars, starts, ends):
    words, cur, cs, ce = [], "", None, None
    for ch, s, e in zip(chars, starts, ends):
        if ch.isspace():
            if cur:
                words.append({"word": cur, "start": cs, "end": ce})
            cur, cs = "", None
            continue
        if cs is None:
            cs = s
        cur += ch
        ce = e
    if cur:
        words.append({"word": cur, "start": cs, "end": ce})
    return words


class EdgeTTS:
    def __init__(self, voice_cfg):
        import edge_tts  # noqa: F401  (pip install edge-tts)

        self.voice = voice_cfg.get("edge_voice", "en-US-AndrewNeural")
        self.rate = voice_cfg.get("edge_rate", "+0%")

    def key(self, text, prev, nxt):
        return "edge_" + hashlib.sha1(json.dumps([text, self.voice, self.rate]).encode()).hexdigest()[:12]

    def synth(self, text, prev, nxt, mp3_path: Path):
        import edge_tts

        async def run():
            com = edge_tts.Communicate(text, self.voice, rate=self.rate, boundary="WordBoundary")
            audio, words = bytearray(), []
            async for chunk in com.stream():
                if chunk["type"] == "audio":
                    audio += chunk["data"]
                elif chunk["type"] == "WordBoundary":
                    s = chunk["offset"] / 1e7
                    words.append({"word": chunk["text"], "start": s, "end": s + chunk["duration"] / 1e7})
            return bytes(audio), words

        audio, words = asyncio.run(run())
        if not audio:
            raise RuntimeError("edge-tts returned no audio")
        mp3_path.write_bytes(audio)
        return reattach_punctuation(text, words)


def reattach_punctuation(text, words):
    """edge-tts word boundaries drop punctuation; restore it from the script for subtitle chunking."""
    toks = text.split()
    out, j = [], 0
    for w in words:
        nw = mx.norm_word(w["word"])
        while j < len(toks) and not mx.norm_word(toks[j]).startswith(nw[:3] or nw):
            j += 1
        if j < len(toks):
            out.append({**w, "word": toks[j]})
            j += 1
        else:
            out.append(w)
    return out


def make_tts(provider, voice_cfg):
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    order = {"auto": ["elevenlabs", "edge"], "elevenlabs": ["elevenlabs"], "edge": ["edge"], "silent": []}[provider]
    for p in order:
        try:
            if p == "elevenlabs":
                if not key:
                    log("ELEVENLABS_API_KEY not set -> trying free edge-tts")
                    continue
                return ElevenLabs(key, voice_cfg)
            if p == "edge":
                return EdgeTTS(voice_cfg)
        except Exception as e:  # noqa: BLE001
            log(f"{p} unavailable: {type(e).__name__}: {e}")
    return None


# =============================================================================== DSP helpers
def env_exp(n, tau, attack=0.002):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / tau)


def svf_bandpass(x, f_curve, q=0.8):
    """Chamberlin state-variable band-pass with per-sample cutoff (sweeps)."""
    low = band = 0.0
    out = np.empty_like(x)
    damp = 1.0 / q
    fc = 2 * np.sin(np.pi * np.clip(f_curve, 20, SR / 6) / SR)
    for i in range(len(x)):
        high = x[i] - low - damp * band
        band += fc[i] * high
        low += fc[i] * band
        out[i] = band
    return out


def pan(x, p):
    """p in [-1,1] (scalar or array) -> stereo (equal power)."""
    ang = (np.asarray(p) + 1) * np.pi / 4
    return np.stack([x * np.cos(ang), x * np.sin(ang)], axis=1)


def norm_peak(x, db=-1.0):
    m = np.max(np.abs(x)) or 1.0
    return x / m * 10 ** (db / 20)


def fade(x, fin=0.003, fout=0.01):
    n = len(x)
    a, b = int(fin * SR), int(fout * SR)
    e = np.ones(n)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if b:
        e[-b:] = np.minimum(e[-b:], np.linspace(1, 0, b))
    return x * (e[:, None] if x.ndim == 2 else e)


def marimba_note(freq, dur=0.6, tau=0.16, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) * env_exp(n, tau)
    x += 0.30 * bright * np.sin(2 * np.pi * freq * 3.93 * t) * env_exp(n, tau * 0.25)
    x += 0.10 * bright * np.sin(2 * np.pi * freq * 9.2 * t) * env_exp(n, tau * 0.08)
    click = RNG.standard_normal(n) * env_exp(n, 0.0025, 0.0003) * 0.25 * bright
    sos = butter(2, 2500, "highpass", fs=SR, output="sos")
    return x + sosfilt(sos, click)


def pluck(freq, dur=0.7, decay=0.996, bright=0.5):
    """Vectorized Karplus-Strong plucked string."""
    n = int(dur * SR)
    N = max(2, int(SR / freq))
    y = np.zeros(n + N + 1)
    burst = RNG.uniform(-1, 1, N)
    burst = lfilter([bright, 1 - bright], [1], burst)
    y[:N] = burst
    i = N
    while i < n + N:
        j = min(i + N, n + N)
        seg = np.arange(i, j)
        y[seg] = decay * 0.5 * (y[seg - N] + y[seg - N + 1])
        i = j
    return y[N : n + N] * env_exp(n, dur * 0.6, 0.001)


# =============================================================================== SFX synthesis
def sfx_whoosh_deep():
    n = int(1.15 * SR)
    t = np.arange(n) / SR
    shape = np.sin(np.pi * np.clip(t / 1.15, 0, 1)) ** 1.6
    peak = 0.62
    f = 320 + 2300 * np.exp(-((t - peak) ** 2) / 0.05)
    noise = RNG.standard_normal(n)
    air = svf_bandpass(noise, f, q=0.9) * shape
    sub_f = 75 - 38 * np.clip((t - 0.45) / 0.6, 0, 1)
    sub = np.sin(2 * np.pi * np.cumsum(sub_f) / SR) * np.clip((t - 0.35) / 0.25, 0, 1) * np.exp(-np.clip(t - 0.6, 0, None) / 0.25)
    st = pan(norm_peak(air, -3), np.linspace(-0.7, 0.7, n)) + pan(norm_peak(sub, -5), 0)
    return fade(norm_peak(st, -1), 0.01, 0.08)


def sfx_pop_marimba():
    x = marimba_note(1046.5, 0.55, 0.12) + 0.5 * marimba_note(1568.0, 0.55, 0.09, 0.6)
    st = np.stack([x, np.concatenate([np.zeros(24), x[:-24]])], axis=1)  # 0.5 ms Haas width
    return fade(norm_peak(st, -1))


def sfx_paper_slide():
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    noise = RNG.standard_normal(n)
    sos = butter(2, [1400, 7000], "bandpass", fs=SR, output="sos")
    x = sosfilt(sos, noise)
    grain = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * (28 + 20 * t) * t + RNG.uniform(0, 6)))
    envl = np.clip(t / 0.05, 0, 1) * np.clip((0.55 - t) / 0.18, 0, 1) * (0.6 + 0.4 * t / 0.55)
    return fade(norm_peak(pan(x * grain * envl, np.linspace(0.35, -0.35, n)), -1), 0.005, 0.03)


def sfx_tug_stretch():
    n = int(0.85 * SR)
    t = np.arange(n) / SR
    f = 170 + 260 * (t / 0.85) ** 1.3 + 9 * np.sin(2 * np.pi * 13 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    b, a = butter(2, 1800, fs=SR)
    tone = lfilter(b, a, saw) * np.clip(t / 0.04, 0, 1) * np.clip((0.85 - t) / 0.12, 0, 1)
    creak = np.zeros(n)
    pos = 0
    while pos < n:
        creak[pos] = RNG.uniform(0.5, 1.0)
        pos += int(SR / RNG.uniform(38, 70))
    creak = lfilter(*butter(2, [400, 3000], "bandpass", fs=SR), creak) * 0.9
    x = norm_peak(tone, -4) + norm_peak(creak, -10)
    return fade(norm_peak(pan(x, np.sin(2 * np.pi * 2.5 * t) * 0.4), -1))


def sfx_border_flip():
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    sw = svf_bandpass(RNG.standard_normal(n), 900 + 5000 * np.clip(t / 0.14, 0, 1), q=1.2) * np.exp(-t / 0.06) * np.clip(t / 0.01, 0, 1)
    tick1 = marimba_note(659.3, 0.42, 0.07)
    tick2 = np.concatenate([np.zeros(int(0.075 * SR)), marimba_note(987.8, 0.42, 0.08)])[:n]
    st = pan(norm_peak(sw, -6), np.linspace(-0.5, 0.5, n)) + pan(norm_peak(tick1, -4), -0.3) + pan(norm_peak(tick2, -4), 0.3)
    return fade(norm_peak(st, -1))


def sfx_chime_reveal():
    n = int(1.9 * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for k, (f0, p) in enumerate([(1318.5, -0.5), (1975.5, 0.0), (2637.0, 0.5)]):
        d = int(k * 0.065 * SR)
        tt = t[: n - d]
        bell = sum(a * np.sin(2 * np.pi * f0 * r * tt) * np.exp(-tt / (0.9 / r ** 0.7)) for r, a in [(1, 1.0), (2.756, 0.35), (5.404, 0.18), (8.933, 0.08)])
        bell *= np.clip(tt / 0.002, 0, 1)
        out[d:] += pan(bell, p)
    shimmer = svf_bandpass(RNG.standard_normal(n), np.full(n, 9000.0), q=2) * np.exp(-t / 0.35) * 0.15
    out += pan(shimmer, 0)
    return fade(norm_peak(out, -1), 0.002, 0.2)


SFX_BUILDERS = {
    "whoosh_deep": sfx_whoosh_deep,
    "pop_marimba": sfx_pop_marimba,
    "paper_slide": sfx_paper_slide,
    "tug_stretch": sfx_tug_stretch,
    "border_flip": sfx_border_flip,
    "chime_reveal": sfx_chime_reveal,
}


# =============================================================================== music bed
NOTE = {"C": 0, "C#": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}


def midi(name, octave):
    return 440.0 * 2 ** ((NOTE[name] + 12 * (octave + 1) - 69) / 12)


def music_bed(total_s, bpm=112):
    """Curious, light 112 BPM bed: marimba arpeggios, plucked pulse bass, soft shaker."""
    beat = 60.0 / bpm
    n = int((total_s + 2) * SR)
    out = np.zeros((n, 2))
    # D dorian-ish loop: Dm9 | Bbmaj7 | Fadd9 | C6 (one chord per bar)
    chords = [
        ("D", ["D", "F", "A", "E"]),
        ("Bb", ["Bb", "D", "F", "A"]),
        ("F", ["F", "A", "C", "G"]),
        ("C", ["C", "E", "G", "A"]),
    ]
    arp = [0, 2, 1, 3, 2, 1, 3, 2]  # 8 eighth notes per bar, chord-tone indices
    accents = [1.0, 0.55, 0.75, 0.5, 0.9, 0.5, 0.7, 0.55]
    cache = {}

    def note(kind, f, **kw):
        k = (kind, round(f, 2))
        if k not in cache:
            cache[k] = marimba_note(f, 0.9, 0.22, 0.7) if kind == "mar" else pluck(f, 0.9, 0.994, 0.35)
        return cache[k]

    def place(x, start, gain, p):
        i = int(start * SR)
        if i >= n:
            return
        seg = x[: n - i]
        out[i : i + len(seg)] += pan(seg * gain, p)

    bars = int(total_s / (4 * beat)) + 2
    for b in range(bars):
        root, tones = chords[b % 4]
        t0 = b * 4 * beat
        for k in range(8):
            if (b % 2 == 1 and k in (3, 7)) or k == 5:
                continue  # breathing room: syncopated rests
            name = tones[arp[k]]
            octv = 5 if arp[k] < 3 else 6
            place(note("mar", midi(name, octv)), t0 + k * beat / 2, 0.22 * accents[k], [-0.35, 0.35][k % 2])
        for k, (off, g) in enumerate([(0, 0.55), (1.5, 0.28), (2, 0.42), (3.5, 0.25)]):
            place(note("pl", midi(root, 2 if k % 2 == 0 else 3)), t0 + off * beat, g, 0)
        for s in range(16):
            if s % 2 == 1:
                sh = RNG.standard_normal(int(0.05 * SR)) * env_exp(int(0.05 * SR), 0.012, 0.002)
                sh = sosfilt(butter(2, 6000, "highpass", fs=SR, output="sos"), sh)
                place(sh, t0 + s * beat / 4, 0.05 if s % 4 == 3 else 0.03, 0.2)
    out = out[: int(total_s * SR)]
    fin, fout = int(1.0 * SR), int(1.6 * SR)
    e = np.ones(len(out))
    e[:fin] = np.linspace(0, 1, fin) ** 2
    e[-fout:] = np.linspace(1, 0, fout) ** 1.5
    return out * e[:, None]


# =============================================================================== continuous narration
def split_words_by_scene(words, scenes):
    """Assign the words of ONE continuous read back to their scenes (same whitespace tokenization)."""
    counts = [len(sc["narration"].split()) for sc in scenes]
    if len(words) == sum(counts):
        out, i = [], 0
        for c in counts:
            out.append(words[i : i + c])
            i += c
        return out
    # tokenization drift (rare): walk the script tokens and match normalized words greedily
    toks = [(k, mx.norm_word(t)) for k, sc in enumerate(scenes) for t in sc["narration"].split()]
    out = [[] for _ in scenes]
    j = 0
    for w in words:
        nw = mx.norm_word(w["word"])
        while j < len(toks) - 1 and toks[j][1] != nw and not (nw and toks[j][1].startswith(nw[:3])):
            j += 1
        out[toks[min(j, len(toks) - 1)][0]].append(w)
        j += 1
    return out


def build_continuous_timeline(sb, clip_len, words_by_scene, lead=0.3, preroll=0.12):
    """One unbroken voiceover: each scene starts just before its first spoken word, so there is
    never inserted silence between scenes (min_duration_s is ignored in continuous mode)."""
    scenes, words, starts = [], [], []
    for i, (sc, ws) in enumerate(zip(sb["scenes"], words_by_scene)):
        st = 0.0 if i == 0 else lead + ws[0]["start"] - preroll
        starts.append(max(st, starts[-1] + 0.5) if starts else st)
    last = sb["scenes"][-1]
    total = lead + clip_len + last.get("tail_s", 0.8)
    for i, (sc, ws) in enumerate(zip(sb["scenes"], words_by_scene)):
        end = starts[i + 1] if i + 1 < len(starts) else total
        for w in ws:
            words.append({"word": w["word"], "start": round(lead + w["start"], 3), "end": round(lead + w["end"], 3), "scene": sc["id"]})
        scenes.append({"id": sc["id"], "start": round(starts[i], 3), "end": round(end, 3), "vo_start": round(lead + ws[0]["start"], 3), "vo_end": round(lead + ws[-1]["end"], 3)})
    return {"fps": sb["meta"].get("fps", 30), "total_s": round(total, 3), "continuous": True, "scenes": scenes, "words": words}


# =============================================================================== timeline + cues
def build_timeline(sb, vo_clips):
    t, scenes, words = 0.0, [], []
    for i, sc in enumerate(sb["scenes"]):
        clip = vo_clips[sc["id"]]
        lead = sc.get("vo_lead_s", 0.3 if i == 0 else 0.18)
        vo_len = len(clip["audio"]) / SR if clip["audio"] is not None else clip["est_len"]
        dur = max(sc.get("min_duration_s", 0.0), lead + vo_len + sc.get("tail_s", 0.5))
        for w in clip["words"]:
            words.append({"word": w["word"], "start": round(t + lead + w["start"], 3), "end": round(t + lead + w["end"], 3), "scene": sc["id"]})
        scenes.append({"id": sc["id"], "start": round(t, 3), "end": round(t + dur, 3), "vo_start": round(t + lead, 3), "vo_end": round(t + lead + vo_len, 3)})
        t += dur
    return {"fps": sb["meta"].get("fps", 30), "total_s": round(t, 3), "scenes": scenes, "words": words}


def resolve_cues(sb, ts):
    cues = []
    for i, sc in enumerate(sb["scenes"]):
        timing = next(s for s in ts["scenes"] if s["id"] == sc["id"])
        clock = mx.SceneClock(sc, timing, ts["words"])
        base = timing["start"]

        def add(name, local_t, gain=-6.0, src=""):
            if name and name in SFX_BUILDERS and 0 <= local_t <= clock.duration:
                cues.append({"name": name, "t": round(base + local_t, 3), "gain_db": gain, "scene": sc["id"], "source": src})

        tr = sc.get("transition_sfx", "whoosh_deep" if i > 0 else None)
        if tr:
            add(tr, 0.0, -4.0, "transition")
        for m in sc.get("mode_at", []) or []:
            add("whoosh_deep", clock.at(m), -5.0, "mode_cut")
        for c in sc.get("sfx", []) or []:
            add(c["name"], clock.at(c), c.get("gain_db", -4.0), "scene.sfx")
        for el in sc.get("elements", []) or []:
            name = el["sfx"] if "sfx" in el else mx.AUTO_SFX.get(el["type"])
            if not name:
                continue
            g = el.get("sfx_gain_db", -6.0)
            if el["type"] == "Counter":
                for st in el.get("steps", []):
                    add(name, clock.at(st), g, "Counter.step")
            elif el["type"] == "ShiftingBorderSpline":
                start = clock.at(el)
                period, sweep = el.get("period_s", 1.6), el.get("sweep_s", 0.6)
                for k in range(el.get("flips", 3)):
                    add(name, start + (k + 1) * round(period * 30) / 30 - round(sweep * 30) / 30, g, "ShiftingBorderSpline.flip")
            else:
                add(name, clock.at(el), g, el["type"])
    cues.sort(key=lambda c: c["t"])
    dedup = []
    for c in cues:
        if dedup and dedup[-1]["name"] == c["name"] and c["t"] - dedup[-1]["t"] < 0.12:
            continue
        dedup.append(c)
    return dedup


# =============================================================================== loudness
def loudnorm(src: Path, dst: Path, lufs=-15.0, tp=-1.5):
    flt = f"loudnorm=I={lufs}:TP={tp}:LRA=11"
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(src), "-af", flt + ":print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    m = json.loads(re.findall(r"\{[^{}]*\}", p.stderr)[-1])
    flt2 = (
        f"{flt}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
        f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
    )
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-af", flt2, "-ar", str(SR), "-c:a", "pcm_s16le", str(dst)], check=True)


def measure_lufs(path: Path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    i = re.findall(r"I:\s+(-?[\d.]+) LUFS", p.stderr)
    tpk = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", p.stderr)
    return (float(i[-1]) if i else None), (float(tpk[-1]) if tpk else None)


# =============================================================================== main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project")
    ap.add_argument("--provider", choices=["auto", "elevenlabs", "edge", "silent"])
    ap.add_argument("--allow-silent", action="store_true", help="if no TTS works, continue with estimated timing")
    ap.add_argument("--no-music", action="store_true", help="same as meta.music.enabled = false")
    a = ap.parse_args()

    paths = mx.project_paths(a.project)
    sb = mx.load_json(paths["storyboard"])
    meta = sb["meta"]
    voice_cfg = meta.get("voice", {})
    adir = paths["audio"]
    (adir / "vo").mkdir(parents=True, exist_ok=True)
    (adir / "sfx").mkdir(parents=True, exist_ok=True)

    provider = a.provider or voice_cfg.get("provider", "auto")
    tts = None if provider == "silent" else make_tts(provider, voice_cfg)
    if tts is None and not (a.allow_silent or provider == "silent"):
        sys.exit("[sound] no TTS provider available (set ELEVENLABS_API_KEY or `pip install edge-tts`), or pass --allow-silent")

    continuous = voice_cfg.get("continuous", True) and tts is not None
    vo_clips = {}
    used_provider = "silent"
    if continuous:
        # ---- 1+2. ONE continuous read of the whole script (cached), split back into scenes
        full = " ".join(sc["narration"].strip() for sc in sb["scenes"])
        key = tts.key(full, None, None)
        mp3, wav, wj = adir / "vo" / f"full_{key}.mp3", adir / "vo" / f"full_{key}.wav", adir / "vo" / f"full_{key}.json"
        if not wj.exists():
            log(f"TTS [{type(tts).__name__} {getattr(tts, 'model', '')}] continuous narration: {len(full)} chars, {len(sb['scenes'])} scenes")
            words = tts.synth(full, None, None, mp3)
            ffmpeg_decode(mp3, wav)
            mx.save_json(wj, words, indent=1)
        else:
            log(f"TTS cache hit: {wj.name}")
        used_provider = "elevenlabs" if key.startswith("el_") else "edge"
        audio = read_wav(wav)
        nz = np.nonzero(np.abs(audio) > 0.01)[0]
        if len(nz):
            audio = audio[: min(len(audio), nz[-1] + int(0.08 * SR))]
        by_scene = split_words_by_scene(mx.load_json(wj), sb["scenes"])
        ts = build_continuous_timeline(sb, len(audio) / SR, by_scene)
        vo_full = audio
    # ---- 1. voiceover per scene (cached)
    scenes = sb["scenes"] if not continuous else []
    for i, sc in enumerate(scenes):
        text = sc["narration"].strip()
        prev = scenes[i - 1]["narration"] if i > 0 else None
        nxt = scenes[i + 1]["narration"] if i + 1 < len(scenes) else None
        if tts is None:
            toks = text.split()
            vo_clips[sc["id"]] = {"audio": None, "est_len": len(toks) * 0.36, "words": [{"word": w, "start": k * 0.36, "end": k * 0.36 + 0.32} for k, w in enumerate(toks)]}
            continue
        key = tts.key(text, prev, nxt)
        mp3, wav, wj = adir / "vo" / f"{sc['id']}_{key}.mp3", adir / "vo" / f"{sc['id']}_{key}.wav", adir / "vo" / f"{sc['id']}_{key}.json"
        if not wj.exists():
            log(f"TTS [{type(tts).__name__}] scene '{sc['id']}': {text[:60]}…")
            try:
                words = tts.synth(text, prev, nxt, mp3)
            except Exception as e:  # noqa: BLE001
                if isinstance(tts, ElevenLabs) and provider == "auto":
                    log(f"ElevenLabs failed ({e}); falling back to edge-tts")
                    tts = make_tts("edge", voice_cfg)
                    if tts is None:
                        sys.exit("[sound] no fallback TTS available")
                    key = tts.key(text, prev, nxt)
                    mp3, wav, wj = adir / "vo" / f"{sc['id']}_{key}.mp3", adir / "vo" / f"{sc['id']}_{key}.wav", adir / "vo" / f"{sc['id']}_{key}.json"
                    words = tts.synth(text, prev, nxt, mp3)
                else:
                    raise
            ffmpeg_decode(mp3, wav)
            mx.save_json(wj, words, indent=1)
        else:
            log(f"TTS cache hit: {wj.name}")
        used_provider = "elevenlabs" if key.startswith("el_") else "edge"
        audio = read_wav(wav)
        # trim trailing silence (keeps word timing, which is relative to clip start)
        nz = np.nonzero(np.abs(audio) > 0.01)[0]
        if len(nz):
            audio = audio[: min(len(audio), nz[-1] + int(0.08 * SR))]
        vo_clips[sc["id"]] = {"audio": audio, "words": mx.load_json(wj)}

    # ---- 2. timeline
    if not continuous:
        ts = build_timeline(sb, vo_clips)
    ts["provider"] = used_provider
    ts["model"] = getattr(tts, "model", None)
    total = ts["total_s"]
    n = int(math.ceil(total * SR))
    vo = np.zeros(n)
    if continuous:
        i0 = int(0.3 * SR)
        seg = vo_full[: n - i0]
        vo[i0 : i0 + len(seg)] += seg
    for sc in ts["scenes"] if not continuous else []:
        clip = vo_clips[sc["id"]]["audio"]
        if clip is None:
            continue
        i = int(sc["vo_start"] * SR)
        seg = clip[: n - i]
        vo[i : i + len(seg)] += seg
    if np.any(vo):
        rms = np.sqrt(np.mean(vo[np.abs(vo) > 0.02] ** 2))
        vo *= 10 ** (-18 / 20) / max(rms, 1e-6)
    write_wav(adir / "vo.wav", vo)

    # ---- 3. SFX
    sfx = {}
    for name in SFX_NAMES:
        x = SFX_BUILDERS[name]()
        write_wav(adir / "sfx" / f"{name}.wav", x)
        sfx[name] = x
    cues = resolve_cues(sb, ts)
    sfx_track = np.zeros((n, 2))
    for c in cues:
        x = sfx[c["name"]] * 10 ** ((c["gain_db"] - 4) / 20)
        i = int(c["t"] * SR)
        seg = x[: max(0, n - i)]
        sfx_track[i : i + len(seg)] += seg
    ts["sfx"] = cues

    # ---- 4. music bed with side-chain ducking keyed by the VO
    music = meta.get("music", {})
    bed = np.zeros((n, 2))
    if a.no_music or music.get("enabled", True) is False:
        log("music bed disabled -> VO + SFX only")
        (adir / "bed.wav").unlink(missing_ok=True)
    else:
        bed = music_bed(total, music.get("bpm", 112))[:n]
        if len(bed) < n:
            bed = np.pad(bed, ((0, n - len(bed)), (0, 0)))
        rms = np.sqrt(np.mean(bed ** 2)) or 1
        bed *= 10 ** (music.get("bed_db", -25) / 20) / rms
        write_wav(adir / "bed.wav", bed)
        env = maximum_filter1d(np.abs(vo), size=int(0.12 * SR))
        env = lfilter([1 - math.exp(-1 / (0.08 * SR))], [1, -math.exp(-1 / (0.08 * SR))], env)
        key = np.clip(env / (np.max(env) * 0.25 + 1e-9), 0, 1)
        gain = 10 ** (music.get("duck_db", -9) * key / 20)
        gain = lfilter([1 - math.exp(-1 / (0.05 * SR))], [1, -math.exp(-1 / (0.05 * SR))], gain)
        bed *= gain[:, None]

    mix = bed + sfx_track + np.stack([vo, vo], axis=1)
    mix = mix / max(1.0, np.max(np.abs(mix)) / 0.98)
    with tempfile.TemporaryDirectory() as td:
        raw = Path(td) / "raw.wav"
        write_wav(raw, mix)
        loudnorm(raw, adir / "mix.wav", meta.get("lufs", -15))
    lufs, tp = measure_lufs(adir / "mix.wav")
    ts["audio"] = {"mix": "assets/audio/mix.wav", "integrated_lufs": lufs, "true_peak_dbfs": tp, "target_lufs": meta.get("lufs", -15)}
    mx.save_json(paths["timestamps"], ts, indent=1)
    log(f"provider={used_provider}  total={total:.2f}s  scenes={len(ts['scenes'])}  words={len(ts['words'])}  sfx cues={len(cues)}")
    for s in ts["scenes"]:
        log(f"  {s['id']:<12} {s['start']:7.2f} -> {s['end']:7.2f}  (vo {s['vo_end'] - s['vo_start']:.2f}s)")
    log(f"mix.wav: {lufs} LUFS integrated, peak {tp} dBFS  -> {adir / 'mix.wav'}")


if __name__ == "__main__":
    main()
