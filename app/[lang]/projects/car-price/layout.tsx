import { cookies } from 'next/headers';
import { SIDEBAR_COLLAPSE_ENABLED } from '@/app/_site/features';
import { SidebarCollapseProvider } from '@/app/_site/SidebarCollapse';

// Scoped to the car-price project pages: read the persisted sidebar-collapse
// preference from its cookie on the server so FinalShell renders the correct
// width on the first paint (no flash / replayed collapse animation on refresh).
// When the feature flag is off we skip the cookie read entirely, which keeps
// these routes statically renderable — fully reversible.
export default async function CarPriceLayout({ children }: { children: React.ReactNode }) {
    if (!SIDEBAR_COLLAPSE_ENABLED) return <>{children}</>;

    const initialCollapsed = (await cookies()).get('cp-sidebar-collapsed')?.value === '1';
    return <SidebarCollapseProvider initialCollapsed={initialCollapsed}>{children}</SidebarCollapseProvider>;
}
