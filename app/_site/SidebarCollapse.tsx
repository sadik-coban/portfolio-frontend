"use client";

import { createContext, useCallback, useContext, useState } from 'react';
import { SIDEBAR_COLLAPSE_ENABLED } from './features';

const COOKIE = 'cp-sidebar-collapsed';
const ONE_YEAR = 60 * 60 * 24 * 365;

type SidebarCollapseCtx = { collapsed: boolean; toggle: () => void };

const Ctx = createContext<SidebarCollapseCtx | null>(null);

/**
 * Holds the desktop car-price sidebar collapse preference.
 *
 * The initial value is read from a cookie on the SERVER (see the car-price
 * layout) and passed in here, so the very first render already paints the
 * correct width. That's what kills the flash / replayed collapse animation on
 * refresh — localStorage can only be read after mount, which forced the sidebar
 * to start expanded and then animate to collapsed every reload. The toggle
 * persists the choice back to the same cookie so the next request renders it
 * correctly too.
 */
export function SidebarCollapseProvider({
    initialCollapsed,
    children,
}: {
    initialCollapsed: boolean;
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(initialCollapsed);

    const toggle = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                document.cookie = `${COOKIE}=${next ? '1' : '0'}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
            } catch { /* ignore */ }
            return next;
        });
    }, []);

    return <Ctx.Provider value={{ collapsed, toggle }}>{children}</Ctx.Provider>;
}

/** Safe to call anywhere: returns an inert default when the feature is off or no provider is mounted. */
export function useSidebarCollapse(): SidebarCollapseCtx {
    const ctx = useContext(Ctx);
    if (!SIDEBAR_COLLAPSE_ENABLED || !ctx) return { collapsed: false, toggle: () => {} };
    return ctx;
}
