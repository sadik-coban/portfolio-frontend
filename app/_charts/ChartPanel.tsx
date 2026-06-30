"use client";

import type { ChartTheme } from './types';

export function ChartPanel({
    theme, title, subtitle, full, height = 300, children,
}: {
    theme: ChartTheme;
    title: string;
    subtitle?: string;
    full?: boolean;
    height?: number;
    children: React.ReactNode;
}) {
    return (
        <div
            className={full ? 'lg:col-span-2' : ''}
            style={{
                background: theme.surface,
                border: '1px solid #e4e2dd',
                borderRadius: 14,
                padding: 22,
                boxShadow: '0 1px 3px rgba(40,40,30,0.05)',
            }}
        >
            <div style={{ marginBottom: 8 }}>
                <h3
                    style={{
                        fontFamily: theme.fontSans,
                        fontSize: 16,
                        fontWeight: 600,
                        color: theme.text,
                        letterSpacing: '-0.018em',
                    }}
                >
                    {title}
                </h3>
                {subtitle && (
                    <p style={{ fontFamily: theme.fontMono, fontSize: 12, color: theme.muted, marginTop: 3 }}>
                        {subtitle}
                    </p>
                )}
            </div>
            <div style={{ height, width: '100%' }}>{children}</div>
        </div>
    );
}
