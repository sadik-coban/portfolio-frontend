"use client";

import { useSyncExternalStore } from 'react';
import { SIDEBAR_COLLAPSE_ENABLED } from './features';
import { SIDEBAR_COLLAPSE_ATTR, SIDEBAR_COLLAPSE_COOKIE } from './sidebar-collapse-boot';

const ONE_YEAR = 60 * 60 * 24 * 365;

type SidebarCollapseState = { collapsed: boolean; toggle: () => void };

/**
 * The desktop car-price sidebar collapse preference.
 *
 * The source of truth is the data-cp-collapsed attribute on <html>. The boot script in the
 * root layout sets it from the cookie before the first paint, and everything that changes
 * the sidebar's look (width, the content's margin, the fading labels) is styled from it with
 * the `cp-collapsed:` variant. That is what kills the flash / replayed collapse animation on
 * refresh while the pages stay prebuilt: the server never needs to know the preference.
 * React state only follows the attribute, for what CSS cannot set: titles and aria-labels.
 * It reads false on the server and during hydration, and the real value right after.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
    listeners.add(onChange);
    return () => { listeners.delete(onChange); };
}

const isCollapsed = () => document.documentElement.hasAttribute(SIDEBAR_COLLAPSE_ATTR);

function toggle() {
    const next = !isCollapsed();
    document.documentElement.toggleAttribute(SIDEBAR_COLLAPSE_ATTR, next);
    try {
        document.cookie = `${SIDEBAR_COLLAPSE_COOKIE}=${next ? '1' : '0'}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    } catch { /* ignore */ }
    listeners.forEach((onChange) => onChange());
}

/** Safe to call anywhere: returns an inert default when the feature is off. */
export function useSidebarCollapse(): SidebarCollapseState {
    const collapsed = useSyncExternalStore(subscribe, isCollapsed, () => false);
    if (!SIDEBAR_COLLAPSE_ENABLED) return { collapsed: false, toggle: () => {} };
    return { collapsed, toggle };
}
