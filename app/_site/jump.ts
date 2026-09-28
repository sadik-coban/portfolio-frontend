import type { MouseEvent } from 'react';

/**
 * Scroll to a section of the current page, even when the URL already carries its hash.
 *
 * A Next <Link> to the URL you are already on (/#work → /#work) is a no-op, so after scrolling
 * back up, a second click on "Projects" did nothing. When the target element is on this page the
 * click is handled here; when it isn't (the link was clicked on /about, say) this returns false
 * and the link navigates as usual — Next scrolls to the hash after a cross-page navigation.
 * Modified clicks (new tab, new window) are left alone.
 *
 * `afterLayout` waits two frames before measuring: the mobile menu closes on the same click, and
 * a scroll computed while it is still open lands a menu's height too far.
 */
export function jumpToSection(e: MouseEvent, id: string, opts: { afterLayout?: boolean } = {}): boolean {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (!document.getElementById(id)) return false;
    e.preventDefault();
    const go = () => {
        const el = document.getElementById(id);
        if (!el) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`);
    };
    if (opts.afterLayout) requestAnimationFrame(() => requestAnimationFrame(go));
    else go();
    return true;
}
