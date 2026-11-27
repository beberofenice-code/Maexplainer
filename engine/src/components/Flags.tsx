import React from "react";

/** Simplified, recognisable flag artwork (3:2), drawn in a 60x40 box. */
export const FlagArt: React.FC<{ code: string }> = ({ code }) => {
  switch (code.toUpperCase()) {
    case "ES":
      return (
        <g>
          <rect width="60" height="40" fill="#AA151B" />
          <rect y="10" width="60" height="20" fill="#F1BF00" />
          <rect x="13" y="14" width="7" height="12" rx="1.5" fill="#AA151B" opacity="0.85" />
        </g>
      );
    case "FR":
      return (
        <g>
          <rect width="20" height="40" fill="#002395" />
          <rect x="20" width="20" height="40" fill="#FFFFFF" />
          <rect x="40" width="20" height="40" fill="#ED2939" />
        </g>
      );
    case "PT":
      return (
        <g>
          <rect width="60" height="40" fill="#FF0000" />
          <rect width="24" height="40" fill="#006600" />
          <circle cx="24" cy="20" r="8" fill="#FFCC00" />
          <circle cx="24" cy="20" r="4.5" fill="#FF0000" stroke="#FFFFFF" strokeWidth="1" />
        </g>
      );
    case "AD":
      return (
        <g>
          <rect width="20" height="40" fill="#10069F" />
          <rect x="20" width="20" height="40" fill="#FEDF00" />
          <rect x="40" width="20" height="40" fill="#D50032" />
          <rect x="25" y="13" width="10" height="13" rx="2" fill="#C7A951" stroke="#8a6d1d" strokeWidth="1" />
        </g>
      );
    case "GB":
    case "UK":
      return (
        <g>
          <rect width="60" height="40" fill="#012169" />
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="8" />
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3" />
          <path d="M30,0 V40 M0,20 H60" stroke="#FFFFFF" strokeWidth="12" />
          <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="7" />
        </g>
      );
    case "MA":
      return (
        <g>
          <rect width="60" height="40" fill="#C1272D" />
          <path
            d="M30,11 L32.6,18.9 L40.9,18.9 L34.2,23.8 L36.7,31.7 L30,26.8 L23.3,31.7 L25.8,23.8 L19.1,18.9 L27.4,18.9 Z"
            fill="none"
            stroke="#006233"
            strokeWidth="2"
          />
        </g>
      );
    case "US":
      return (
        <g>
          <rect width="60" height="40" fill="#FFFFFF" />
          {Array.from({ length: 7 }).map((_, i) => (
            <rect key={i} y={i * (40 / 6.5)} width="60" height={40 / 13} fill="#B22234" />
          ))}
          <rect width="26" height="21.5" fill="#3C3B6E" />
        </g>
      );
    case "MC":
      return (
        <g>
          <rect width="60" height="20" fill="#CE1126" />
          <rect y="20" width="60" height="20" fill="#FFFFFF" />
        </g>
      );
    default:
      return (
        <g>
          <rect width="60" height="40" fill="#DDDDDD" />
          <text x="30" y="26" fontSize="14" textAnchor="middle" fontWeight="900" fill="#333">
            {code}
          </text>
        </g>
      );
  }
};

export const Flag: React.FC<{ code: string; width: number; wave?: number }> = ({ code, width, wave = 0 }) => (
  <svg width={width} height={(width * 2) / 3} viewBox="0 0 60 40" style={{ overflow: "visible", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.5))" }}>
    <defs>
      <clipPath id={`flagclip-${code}`}>
        <rect width="60" height="40" rx="3" />
      </clipPath>
    </defs>
    <g clipPath={`url(#flagclip-${code})`} transform={`skewY(${wave})`}>
      <FlagArt code={code} />
      <rect width="60" height="40" fill="url(#none)" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
    </g>
  </svg>
);
