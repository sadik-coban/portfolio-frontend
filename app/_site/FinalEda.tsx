"use client";

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import FinalShell from './FinalShell';
import EChartsEdaPlots, { type EdaLabels } from '../_charts/EChartsEdaPlots';
import { makeHybridTheme } from '../_charts/types';
import { useLang } from './i18n';

export default function FinalEda({ eda }: { eda: any }) {
    const { resolvedTheme } = useTheme();
    const { t } = useLang();
    const theme = useMemo(() => makeHybridTheme(resolvedTheme === 'dark'), [resolvedTheme]);

    const labels: EdaLabels = {
        priceDist: [t('eda.priceDist'), t('eda.priceDist.s')],
        priceYear: [t('eda.priceYear'), t('eda.priceYear.s')],
        brand: [t('eda.brand'), t('eda.brand.s')],
        fuel: [t('eda.fuel'), t('eda.fuel.s')],
        scatter: [t('eda.scatter'), t('eda.scatter.s')],
        body: [t('eda.body'), t('eda.body.s')],
        corr: [t('eda.corr'), t('eda.corr.s')],
        damage: [t('eda.damage'), t('eda.damage.s')],
    };

    return (
        <FinalShell active="eda" kicker={t('dash.kicker')} title={t('eda.title')} meta={t('eda.meta', { n: eda.meta.totalRows.toLocaleString() })}>
            <p className="mb-6 text-[15px] leading-[1.6] text-[#5f5f5a] max-w-[580px]">{t('eda.note', { n: eda.meta.totalRows.toLocaleString() })}</p>
            <EChartsEdaPlots eda={eda} theme={theme} labels={labels} />
        </FinalShell>
    );
}
