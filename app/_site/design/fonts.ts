import { DM_Sans, Space_Grotesk } from 'next/font/google';

// The site frame's type pairing (design-system/sadik-coban/MASTER.md, "Tech Startup"):
// Space Grotesk for display, DM Sans for text. Loaded here rather than in the root layout so
// only the pages that render PaperShell download them — the project pages keep Inter and never
// fetch these. latin-ext carries the Turkish ğ ş ı İ; without it /tr would fall back mid-word.
export const spaceGrotesk = Space_Grotesk({ subsets: ['latin', 'latin-ext'], variable: '--font-space-grotesk' });
export const dmSans = DM_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-dm-sans' });

export const siteFontVars = `${spaceGrotesk.variable} ${dmSans.variable}`;
