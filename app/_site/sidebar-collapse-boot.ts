// The car-price sidebar's collapse preference, shared by the boot script below (root layout)
// and SidebarCollapse.tsx. A plain module, not "use client": the root layout is a server
// component and needs the script as a string.

/** Cookie the toggle writes: "1" collapsed, "0" expanded. */
export const SIDEBAR_COLLAPSE_COOKIE = 'cp-sidebar-collapsed';

/** Set on <html> while the sidebar is collapsed; the `cp-collapsed:` variant (globals.css) styles from it. */
export const SIDEBAR_COLLAPSE_ATTR = 'data-cp-collapsed';

/**
 * Inline script in the root layout's <head>. It runs before the body is parsed, so the first
 * paint already has the stored width: the pages are prebuilt and the same for everyone, and
 * the sidebar's look follows this attribute rather than anything rendered on the server.
 * One template literal on purpose: Next 16.1's compiler dropped the text after `${…}` when two
 * were joined with `+`, which shipped a script with a syntax error.
 */
export const SIDEBAR_COLLAPSE_BOOT = `try {
    if (document.cookie.split('; ').indexOf('${SIDEBAR_COLLAPSE_COOKIE}=1') > -1)
        document.documentElement.setAttribute('${SIDEBAR_COLLAPSE_ATTR}', '');
} catch (e) {}`;
