// Blog and the project journal are off for now. The flag stays because the switch it controls is
// one coherent feature: /blog, /blog/[slug] and /projects/car-price/journal answer 404, the Blog
// entry leaves the top nav, the Journal entry leaves the project sidebar, the homepage drops its
// "latest writing" section, and the sitemap stops listing any of them. Flip it to true and all of
// that comes back with no other edit — the pages, the MDX post and lib/mdx.ts are all still here.
//
// The journal rides on the same flag on purpose: it is not separate content, it is the same posts
// filtered by project (lib/mdx.ts → getPostsByProject), so it has nothing to show while the blog
// is closed.
export const WRITING_ENABLED = false;
