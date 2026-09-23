import { Archivo, Space_Grotesk } from 'next/font/google';

// The site frame's type pairing (design-system/sadik-coban/MASTER.md): Archivo for display,
// Space Grotesk for text. Loaded here rather than in the root layout so only the pages that
// render PaperShell download them — the project pages keep Inter and never fetch these.
// latin-ext carries the Turkish ğ ş ı İ; without it /tr would fall back mid-word.
export const archivo = Archivo({ subsets: ['latin', 'latin-ext'], variable: '--font-archivo' });
export const spaceGrotesk = Space_Grotesk({ subsets: ['latin', 'latin-ext'], variable: '--font-space-grotesk' });

export const siteFontVars = `${archivo.variable} ${spaceGrotesk.variable}`;
