"use client";

import FinalShell from '../FinalShell';
import FinalReportSiteData from './FinalReportSiteData';
import { useLang } from '../i18n';

export default function FinalReport() {
    const { t } = useLang();

    return (
        <FinalShell active="report" kicker={t('rep.kicker')} title={t('rep.title')}>
            <FinalReportSiteData />
        </FinalShell>
    );
}
