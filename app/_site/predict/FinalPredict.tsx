"use client";

import React, { useState, useEffect } from 'react';
import { Car, Zap, Award, AlertTriangle, Loader2 } from 'lucide-react';
import { carService } from '@/lib/services/car-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import FinalShell from '../FinalShell';
import { useLang } from '../i18n';

const FIELD = "w-full h-12 bg-[#f7f6f3] border-[#d8d6d0] rounded-[10px] px-4 text-base text-[#1a1a1a] focus:border-[#047857]";
const CURRENT_YEAR = 2026;

// Training vocabularies (the model's cat_maps use these exact Turkish values).
const BRANDS = [{ v: 'bmw', label: 'BMW' }, { v: 'audi', label: 'Audi' }];
const BODY = ['Sedan', 'Hatchback/5', 'Hatchback/3', 'Station wagon', 'Coupe', 'Cabrio', 'MPV'];
const DRIVE = ['Arkadan İtiş', 'Önden Çekiş', '4WD (Sürekli)', 'AWD (Elektronik)'];
const TRANS = ['Otomatik', 'Düz', 'Yarı Otomatik'];
const FUEL = ['Benzin', 'Dizel', 'LPG & Benzin', 'Hibrit'];
const SEG = ['B', 'C', 'D', 'E', 'F', 'S'];

export default function FinalPredict() {
    const { t, lang } = useLang();
    const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [seriesDict, setSeriesDict] = useState<{ b: number; name: string }[]>([]);

    const [form, setForm] = useState({
        brand: 'bmw', series: '', model: '',
        kb_body_type: 'Sedan', kb_drivetrain: 'Arkadan İtiş', segment: 'D',
        kb_transmission: 'Otomatik', kb_fuel: 'Benzin',
        year: 2020, gb_mileage: 50000, power_hp_val: 170, engine_cc_val: 1598,
        count_painted: 0, count_changed: 0, count_local_painted: 0, is_heavy_damaged: 0,
    });
    const set = (patch: Partial<typeof form>) => setForm((p) => ({ ...p, ...patch }));

    useEffect(() => { carService.getBiMeta().then((m) => setSeriesDict(m.dict.series)).catch(() => {}); }, []);
    const bIdx = form.brand === 'bmw' ? 0 : 1;
    const seriesOptions = [...new Set(seriesDict.filter((s) => s.b === bIdx).map((s) => s.name))].sort((a, b) => a.localeCompare(b, 'tr'));

    const handlePredict = async () => {
        setError(null);
        if (!form.series || !form.model) { setError(t('pr.errFields')); return; }
        setLoading(true); setResult(null);
        try {
            const payload = {
                brand: form.brand, series: form.series, model: form.model,
                kb_body_type: form.kb_body_type, kb_drivetrain: form.kb_drivetrain, segment: form.segment,
                kb_transmission: form.kb_transmission, kb_fuel: form.kb_fuel,
                vehicle_age: Math.max(0, CURRENT_YEAR - Number(form.year)),
                gb_mileage: Number(form.gb_mileage), power_hp_val: Number(form.power_hp_val),
                engine_cc_val: Number(form.engine_cc_val), count_painted: Number(form.count_painted),
                count_changed: Number(form.count_changed), count_local_painted: Number(form.count_local_painted),
                is_heavy_damaged: form.is_heavy_damaged,
            };
            setResult(await carService.predictBest(payload));
        } catch { setError(t('pr.errFail')); } finally { setLoading(false); }
    };

    const Section = ({ title, icon: Icon, danger }: any) => (
        <h3 className={cn("text-base font-semibold mb-5 flex items-center gap-2 border-b border-[#e9e7e2] pb-3 text-[#1a1a1a]", danger ? 'text-amber-600' : '')}>
            <Icon size={18} className={danger ? 'text-amber-500' : 'text-[#047857]'} /> {title}
        </h3>
    );
    const Opt = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) => (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={FIELD}><SelectValue /></SelectTrigger>
            <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
    );

    return (
        <FinalShell active="predict" kicker={t('pr.kicker')} title={t('pr.title')}>
            <p className="mb-6 max-w-[580px] text-[15px] leading-[1.6] text-[#5f5f5a]">{t('pr.desc')}</p>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* FORM */}
                <div className="xl:col-span-8">
                    <div className="rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-6 md:p-8 shadow-[0_1px_3px_rgba(40,40,30,0.05)]">
                        <Section title={t('pr.s1')} icon={Car} />
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                            <Field label={t('pr.brand')}>
                                <Select value={form.brand} onValueChange={(v) => set({ brand: v, series: '' })}>
                                    <SelectTrigger className={FIELD}><SelectValue /></SelectTrigger>
                                    <SelectContent>{BRANDS.map((b) => <SelectItem key={b.v} value={b.v}>{b.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </Field>
                            <Field label={t('pr.series')}>
                                <Select value={form.series} onValueChange={(v) => set({ series: v })} disabled={!seriesOptions.length}>
                                    <SelectTrigger className={FIELD}><SelectValue placeholder={t('pr.select')} /></SelectTrigger>
                                    <SelectContent>{seriesOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </Field>
                            <Field label={t('pr.model')}>
                                <Input value={form.model} onChange={(e) => set({ model: e.target.value })} className={FIELD} placeholder="520i Executive M Sport" />
                            </Field>
                            <Field label={t('pr.year')}><Input type="number" value={form.year} onChange={(e) => set({ year: Number(e.target.value) })} className={FIELD} /></Field>
                            <Field label={t('pr.mileage')}><Input type="number" value={form.gb_mileage} onChange={(e) => set({ gb_mileage: Number(e.target.value) })} className={FIELD} /></Field>
                            <Field label={t('pr.segment')}><Opt value={form.segment} onChange={(v) => set({ segment: v })} options={SEG} /></Field>
                        </div>

                        <Section title={t('pr.s2')} icon={Zap} />
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                            <Field label={t('pr.fuel')}><Opt value={form.kb_fuel} onChange={(v) => set({ kb_fuel: v })} options={FUEL} /></Field>
                            <Field label={t('pr.transmission')}><Opt value={form.kb_transmission} onChange={(v) => set({ kb_transmission: v })} options={TRANS} /></Field>
                            <Field label={t('pr.body')}><Opt value={form.kb_body_type} onChange={(v) => set({ kb_body_type: v })} options={BODY} /></Field>
                            <Field label={t('pr.drivetrain')}><Opt value={form.kb_drivetrain} onChange={(v) => set({ kb_drivetrain: v })} options={DRIVE} /></Field>
                            <Field label={t('pr.power')}><Input type="number" value={form.power_hp_val} onChange={(e) => set({ power_hp_val: Number(e.target.value) })} className={FIELD} /></Field>
                            <Field label={t('pr.engine')}><Input type="number" value={form.engine_cc_val} onChange={(e) => set({ engine_cc_val: Number(e.target.value) })} className={FIELD} /></Field>
                        </div>

                        <Section title={t('pr.s3')} icon={AlertTriangle} danger />
                        <div className="rounded-[14px] bg-amber-500/[0.06] border border-amber-500/20 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {([['count_painted', L('Boyalı parça', 'Painted parts')], ['count_changed', L('Değişen parça', 'Changed parts')], ['count_local_painted', L('Lokal boyalı', 'Local paint')]] as const).map(([key, label]) => (
                                    <Field key={key} label={label}>
                                        <Input type="number" min={0} max={13} value={(form as any)[key]} onChange={(e) => set({ [key]: Math.max(0, Number(e.target.value)) } as any)} className="w-full h-12 bg-[#fdfcf9] border-amber-500/30 text-center font-semibold rounded-[10px] text-[#1a1a1a]" />
                                    </Field>
                                ))}
                            </div>
                            <button onClick={() => set({ is_heavy_damaged: form.is_heavy_damaged ? 0 : 1 })} className={cn("mt-6 w-full flex items-center justify-center gap-3 rounded-[10px] border h-12 text-sm font-medium transition-all", form.is_heavy_damaged ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]" : "bg-[#f7f6f3] border-[#e4e2dd] text-[#5f5f5a]")}>
                                <span className={cn("w-5 h-5 rounded-md border grid place-items-center", form.is_heavy_damaged ? "bg-[#ef4444] border-[#ef4444]" : "border-[#c4c2bb]")}>
                                    {form.is_heavy_damaged === 1 && <span className="w-2 h-2 bg-white rounded-full" />}
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
                        <div className={cn("rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-8 transition-all shadow-[0_1px_3px_rgba(40,40,30,0.05)]", result ? "opacity-100" : "opacity-70")}>
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-[14px] mb-5"><Award size={32} /></div>
                                <h3 className="text-xs font-semibold text-[#5f5f5a] uppercase tracking-wider mb-3">{t('pr.result')}</h3>
                                {result ? (
                                    <>
                                        <div className="font-mono text-5xl font-bold tracking-[-0.03em] tabular-nums text-[#047857] mb-1">{result.price?.toLocaleString('en-US')}</div>
                                        <span className="text-[#86857e] block mb-6">{t('pr.liras')}</span>
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-[#f3f1ec] p-3 rounded-xl"><span className="text-[10px] font-medium text-[#86857e] uppercase block mb-1">{t('pr.min')}</span><span className="font-semibold tabular-nums">{result.price_range?.min?.toLocaleString('en-US')}</span></div>
                                            <div className="bg-[#f3f1ec] p-3 rounded-xl"><span className="text-[10px] font-medium text-[#86857e] uppercase block mb-1">{t('pr.max')}</span><span className="font-semibold tabular-nums">{result.price_range?.max?.toLocaleString('en-US')}</span></div>
                                        </div>
                                        <div className="bg-[#f1f8f4] border border-[#cfe8dc] p-3 rounded-[12px] text-left">
                                            <div className="font-mono text-[11px] text-[#047857] font-semibold">{result.model}</div>
                                            <div className="font-mono text-[11px] text-[#5f5f5a] mt-0.5">±{result.price_range?.margin_percent}% · {L('OOF MAPE bandı', 'OOF MAPE band')}</div>
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

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-[#5f5f5a]">{label}</Label>
            {children}
        </div>
    );
}
