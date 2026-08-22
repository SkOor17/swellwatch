/// <reference types="vite/client" />

declare module '@tailwindcss/vite' {
  import type { Plugin } from 'vite';

  export interface PluginOptions {
    optimize?: boolean | { minify?: boolean };
  }

  export default function tailwindcss(opts?: PluginOptions): Plugin[];
}
