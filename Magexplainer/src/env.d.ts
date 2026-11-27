// Webpack's require.context, used by src/project.ts to discover projects/*.
interface WebpackRequireContext {
  keys(): string[];
  (id: string): unknown;
}
declare namespace NodeJS {
  interface Require {
    context(directory: string, useSubdirectories: boolean, regExp: RegExp): WebpackRequireContext;
  }
}
