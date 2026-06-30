"use client";

import React, { useState, useEffect } from 'react';
import { Car, Zap, Award, AlertTriangle, Loader2, PenLine, ListFilter } from 'lucide-react';
import { carService, ModelVersion } from '@/lib/services/car-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import FinalShell from '../FinalShell';
import { useLang } from '../i18n';

const FIELD = "w-full h-12 bg-[#f7f6f3] border-[#d8d6d0] rounded-[10px] px-4 text-base text-[#1a1a1a] focus:border-[#047857]";

export default function FinalPredict() {
    const { t } = useLang();
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [versions, setVersions] = useState<ModelVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState('');
    const [brands, setBrands] = useState<string[]>([]);
    const [series, setSeries] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [isLoadingSeries, setIsLoadingSeries] = useState(false);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [isCustomModel, setIsCustomModel] = useState(false);

    const [formData, setFormData] = useState({
        brand: '', series: '', model: '', year: 2020, mileage: 50000,
        transmission: 'Automatic', fuel: 'Gasoline', body_type: 'Sedan',
        engine_cc_val: 1598, power_hp_val: 170, torque_nm: 250, cylinder_count: 4,
        kb_drivetrain: 'RWD', segment_clean: 'D Segment',
        gb_warranty_status: 'No Warranty', is_heavy_damaged: 0,
    });
    const [damageData, setDamageData] = useState({
        roof_status: 'Original', hood_status: 'Original', trunk_status: 'Original',
        doors_changed: 0, doors_painted: 0, doors_local: 0,
        fenders_changed: 0, fenders_painted: 0, fenders_local: 0,
    });

    useEffect(() => {
        carService.getBrands().then(setBrands).catch(() => {});
        carService.getVersions().then((d) => { setVersions(d); if (d.length) setSelectedVersion(d[0].version_id); }).catch(() => {});
    }, []);
    useEffect(() => {
        setSeries([]); setModels([]); setFormData((p) => ({ ...p, series: '', model: '' }));
        if (formData.brand) { setIsLoadingSeries(true); carService.getSeriesByBrand(formData.brand).then(setSeries).finally(() => setIsLoadingSeries(false)); }
        // eslint-disable-next-line
    }, [formData.brand]);
    useEffect(() => {
        setModels([]); setFormData((p) => ({ ...p, model: '' }));
        if (formData.brand && formData.series) { setIsLoadingModels(true); carService.getModelsBySeries(formData.brand, formData.series).then(setModels).finally(() => setIsLoadingModels(false)); }
        // eslint-disable-next-line
    }, [formData.series]);

    const handlePredict = async () => {
        setLoading(true); setError(null); setResultData(null);
        if (!selectedVersion) { setError(t('pr.errVersion')); setLoading(false); return; }
        if (!formData.brand || !formData.series || !formData.model) { setError(t('pr.errFields')); setLoading(false); return; }
        try {
            const res = await carService.predictPrice(selectedVersion, { ...formData, damage_details: damageData });
            setResultData(res);
        } catch { setError(t('pr.errFail')); } finally { setLoading(false); }
    };
    const dmg = (key: string, value: string | number) => setDamageData((p) => ({ ...p, [key]: value }));

    const Section = ({ title, icon: Icon, danger }: any) => (
        <h3 className={cn("text-base font-semibold mb-5 flex items-center gap-2 border-b border-[#e9e7e2] pb-3 text-[#1a1a1a]", danger ? 'text-amber-600' : '')}>
            <Icon size={18} className={danger ? 'text-amber-500' : 'text-[#047857]'} /> {title}
        </h3>
    );

    return (
        <FinalShell active="predict" kicker={t('pr.kicker')} title={t('pr.title')}>
            <p className="mb-6 max-w-[580px] text-[15px] leading-[1.6] text-[#5f5f5a]">{t('pr.desc')}</p>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* FORM */}
                <div className="xl:col-span-8 space-y-6">
                    {/* version */}
                    <div className="flex justify-end">
                        <div className="w-full sm:w-[220px]">
                            <label className="text-xs font-medium text-[#5f5f5a] mb-1 block">{t('pr.version')}</label>
                            <Select value={selectedVersion} onValueChange={setSelectedVersion} disabled={!versions.length}>
                                <SelectTrigger className="h-10"><SelectValue placeholder={t('pr.select')} /></SelectTrigger>
                                <SelectContent>{versions.map((v) => <SelectItem key={v.version_id} value={v.version_id}>{v.version_id.toUpperCase()} <span className="text-[#86857e] text-xs ml-2">({v.date})</span></SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-6 md:p-8 shadow-[0_1px_3px_rgba(40,40,30,0.05)]">
                        <Section title={t('pr.s1')} icon={Car} />
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                            <Field label={t('pr.brand')}>
                                <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
                                    <SelectTrigger className={FIELD}><SelectValue placeholder={t('pr.select')} /></SelectTrigger>
                                    <SelectContent>{brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                </Select>
                            </Field>
                            <Field label={t('pr.series')} loading={isLoadingSeries}>
                                <Select value={formData.series} onValueChange={(v) => setFormData({ ...formData, series: v })} disabled={!formData.brand || isLoadingSeries}>
                                    <SelectTrigger className={FIELD}><SelectValue placeholder={isLoadingSeries ? t('pr.loading') : t('pr.select')} /></SelectTrigger>
                                    <SelectContent>{series.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </Field>
                            <Field label={t('pr.model')} loading={isLoadingModels} action={
                                <button onClick={() => setIsCustomModel(!isCustomModel)} disabled={!formData.series} className="text-xs font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 disabled:opacity-50">
                                    {isCustomModel ? <><ListFilter size={13} /> {t('pr.selectList')}</> : <><PenLine size={13} /> {t('pr.manual')}</>}
                                </button>
                            }>
                                {isCustomModel ? (
                                    <Input value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} disabled={!formData.series} className={FIELD} placeholder="320i ED Sport Line" />
                                ) : (
                                    <Select value={formData.model} onValueChange={(v) => setFormData({ ...formData, model: v })} disabled={!formData.series || isLoadingModels}>
                                        <SelectTrigger className={FIELD}><SelectValue placeholder={isLoadingModels ? t('pr.loading') : t('pr.select')} /></SelectTrigger>
                                        <SelectContent>{models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}<SelectItem value="Other" className="font-medium text-emerald-600">Other</SelectItem></SelectContent>
                                    </Select>
                                )}
                            </Field>
                            <Field label={t('pr.year')}><Input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })} className={FIELD} /></Field>
                            <Field label={t('pr.mileage')}><Input type="number" value={formData.mileage} onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })} className={FIELD} /></Field>
                            <Field label={t('pr.segment')}>
                                <Select value={formData.segment_clean} onValueChange={(v) => setFormData({ ...formData, segment_clean: v })}>
                                    <SelectTrigger className={FIELD}><SelectValue /></SelectTrigger>
                                    <SelectContent>{["A Segment", "B Segment", "C Segment", "D Segment", "E Segment", "F Segment", "SUV"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </Field>
                        </div>

                        <Section title={t('pr.s2')} icon={Zap} />
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                            <Field label={t('pr.fuel')}>
                                <Select value={formData.fuel} onValueChange={(v) => setFormData({ ...formData, fuel: v })}>
                                    <SelectTrigger className={FIELD}><SelectValue /></SelectTrigger>
                                    <SelectContent>{["Gasoline", "Diesel", "LPG", "Hybrid", "Electric"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </Field>
                            <Field label={t('pr.transmission')}>
                                <Select value={formData.transmission} onValueChange={(v) => setFormData({ ...formData, transmission: v })}>
                                    <SelectTrigger className={FIELD}><SelectValue /></SelectTrigger>
                                    <SelectContent>{["Automatic", "Manual", "Semi-Automatic"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </Field>
                            <Field label={t('pr.body')}>
                                <Select value={formData.body_type} onValueChange={(v) => setFormData({ ...formData, body_type: v })}>
                                    <SelectTrigger className={FIELD}><SelectValue /></SelectTrigger>
                                    <SelectContent>{["Sedan", "Hatchback", "Station Wagon", "Coupe", "Cabrio", "SUV", "MPV"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </Field>
                            <Field label={t('pr.drivetrain')}>
                                <Select value={formData.kb_drivetrain} onValueChange={(v) => setFormData({ ...formData, kb_drivetrain: v })}>
                                    <SelectTrigger className={FIELD}><SelectValue /></SelectTrigger>
                                    <SelectContent>{["FWD", "RWD", "4WD", "AWD"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </Field>
                            <Field label={t('pr.power')}><Input type="number" value={formData.power_hp_val} onChange={(e) => setFormData({ ...formData, power_hp_val: Number(e.target.value) })} className={FIELD} /></Field>
                            <Field label={t('pr.engine')}><Input type="number" value={formData.engine_cc_val} onChange={(e) => setFormData({ ...formData, engine_cc_val: Number(e.target.value) })} className={FIELD} /></Field>
                            <Field label={t('pr.warranty')}>
                                <Select value={formData.gb_warranty_status} onValueChange={(v) => setFormData({ ...formData, gb_warranty_status: v })}>
                                    <SelectTrigger className={FIELD}><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="No Warranty">No Warranty</SelectItem><SelectItem value="Warranty Continues">Warranty Continues</SelectItem></SelectContent>
                                </Select>
                            </Field>
                        </div>

                        <Section title={t('pr.s3')} icon={AlertTriangle} danger />
                        <div className="rounded-[14px] bg-amber-500/[0.06] border border-amber-500/20 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                                {[['roof_status', t('pr.roof')], ['hood_status', t('pr.hood')], ['trunk_status', t('pr.trunk')]].map(([field, label]) => (
                                    <Field key={field} label={label}>
                                        <Select value={(damageData as any)[field]} onValueChange={(v) => dmg(field, v)}>
                                            <SelectTrigger className={FIELD}><SelectValue /></SelectTrigger>
                                            <SelectContent>{["Original", "Painted", "Locally Painted", "Changed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </Field>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {[['doors', t('pr.doors')], ['fenders', t('pr.fenders')]].map(([grp, label]) => (
                                    <div key={grp}>
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#5f5f5a] mb-3">{label}</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[['changed', t('pr.changed')], ['painted', t('pr.painted')], ['local', t('pr.local')]].map(([type, tl]) => (
                                                <div key={type} className="space-y-1.5">
                                                    <Label className="text-[11px] text-[#5f5f5a] block text-center">{tl}</Label>
                                                    <Input type="number" min={0} max={4} value={(damageData as any)[`${grp}_${type}`]} onChange={(e) => dmg(`${grp}_${type}`, Number(e.target.value))} className="w-full h-12 bg-[#fdfcf9] border-amber-500/30 text-center font-semibold rounded-[10px] text-[#1a1a1a]" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setFormData({ ...formData, is_heavy_damaged: formData.is_heavy_damaged ? 0 : 1 })} className={cn("mt-6 w-full flex items-center justify-center gap-3 rounded-[10px] border h-12 text-sm font-medium transition-all", formData.is_heavy_damaged ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]" : "bg-[#f7f6f3] border-[#e4e2dd] text-[#5f5f5a]")}>
                                <span className={cn("w-5 h-5 rounded-md border grid place-items-center", formData.is_heavy_damaged ? "bg-[#ef4444] border-[#ef4444]" : "border-[#c4c2bb]")}>
                                    {formData.is_heavy_damaged === 1 && <span className="w-2 h-2 bg-white rounded-full" />}
                                </span>
                                {t('pr.heavy')}
                            </button>
                        </div>

                        <Button onClick={handlePredict} disabled={loading} className="w-full mt-8 h-14 text-lg font-semibold bg-[#047857] hover:bg-[#065f46] text-white rounded-[10px]">
                            {loading ? <><Loader2 className="animate-spin mr-2 w-5 h-5" /> {t('pr.calculating')}</> : <><Zap className="mr-2 w-5 h-5" /> {t('pr.calculate')}</>}
                        </Button>
                        {error && (
                            <div className="mt-4 p-3 bg-[#ef4444]/10 text-[#ef4444] text-sm text-center rounded-xl flex items-center justify-center gap-2">
                                <AlertTriangle size={16} /> {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* RESULT */}
                <div className="xl:col-span-4">
                    <div className="sticky top-6">
                        <div className={cn("rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-8 transition-all shadow-[0_1px_3px_rgba(40,40,30,0.05)]", resultData ? "opacity-100" : "opacity-70")}>
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-[14px] mb-5"><Award size={32} /></div>
                                <h3 className="text-xs font-semibold text-[#5f5f5a] uppercase tracking-wider mb-3">{t('pr.result')}</h3>
                                {resultData ? (
                                    <>
                                        <div className="font-mono text-5xl font-bold tracking-[-0.03em] tabular-nums text-[#047857] mb-1">{resultData.price?.toLocaleString('en-US')}</div>
                                        <span className="text-[#86857e] block mb-6">{t('pr.liras')}</span>
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <div className="bg-[#f3f1ec] p-3 rounded-xl"><span className="text-[10px] font-medium text-[#86857e] uppercase block mb-1">{t('pr.min')}</span><span className="font-semibold">{resultData.price_range?.min?.toLocaleString()}</span></div>
                                            <div className="bg-[#f3f1ec] p-3 rounded-xl"><span className="text-[10px] font-medium text-[#86857e] uppercase block mb-1">{t('pr.max')}</span><span className="font-semibold">{resultData.price_range?.max?.toLocaleString()}</span></div>
                                        </div>
                                        <div className="bg-[#f3f1ec] p-4 rounded-[14px] text-left">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-medium text-[#5f5f5a] uppercase flex items-center gap-1.5"><AlertTriangle size={13} /> {t('pr.damageScore')}</span>
                                                <span className="text-xs font-semibold">{resultData.calculated_risk_score} / 500</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                                                <div className={cn("h-full rounded-full transition-all duration-700", resultData.calculated_risk_score < 100 ? "bg-emerald-500" : resultData.calculated_risk_score < 300 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${Math.min((resultData.calculated_risk_score / 500) * 100, 100)}%` }} />
                                            </div>
                                            <p className="text-xs text-[#5f5f5a]">{resultData.calculated_risk_score < 100 ? t('pr.clean') : resultData.calculated_risk_score < 300 ? t('pr.moderate') : t('pr.high')}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-36 flex flex-col items-center justify-center text-[#9a9a92] gap-3 border-2 border-dashed border-[#e4e2dd] rounded-[14px]">
                                        <Car size={28} className="opacity-30" /><span className="text-sm">{t('pr.placeholder')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FinalShell>
    );
}

function Field({ label, children, loading, action }: { label: React.ReactNode; children: React.ReactNode; loading?: boolean; action?: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center min-h-[20px]">
                <Label className="text-sm font-medium text-[#5f5f5a]">{label}{loading && <Loader2 size={13} className="inline ml-2 animate-spin text-emerald-600" />}</Label>
                {action}
            </div>
            {children}
        </div>
    );
}
