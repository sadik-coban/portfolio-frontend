"use client";

import FinalShell from '../FinalShell';
import FinalReportAnalysis from './FinalReportAnalysis';
import { useLang } from '../i18n';

export default function FinalReport() {
    const { t } = useLang();

    return (
        <FinalShell active="report" kicker={t('rep.desc')} title={t('rep.title')}>
            <FinalReportAnalysis />
        </FinalShell>
    );
}
