"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Loader2, ServerCrash, Banknote, ShieldCheck, Gauge, MapPin, Wrench, RotateCcw, Filter } from 'lucide-react';
import FinalShell from '../FinalShell';
import * as LBL from '@/lib/labels';
import { useLang } from '../i18n';
import { makeHybridTheme, GREEN_RAMP } from '../../_charts/types';
import { type Rows, type Filters, type Agg, EMPTY_FILTERS, SEG, FUEL } from './compute';
import { carService } from '@/lib/services/car-service';

// ---------------------------------------------------------------------------
// Car Price BI — "Market Intelligence Report". Fetches server-side aggregates from
// the FastAPI backend (/api/bi/meta once + /api/bi/agg per filter change) so the
// ~30K raw rows never reach the browser (privacy). All charts + the Turkey map
// render from the returned Agg. Light-only, bilingual via the local L() helper.
// ---------------------------------------------------------------------------

const GD = '#047857', G = '#059669';

// car top-view damage layout → indices into PARTS
const DMG_LAYOUT: ({ pi: number; tr: string; en: string } | null)[][] = [
    [{ pi: 7, tr: 'Sol Ön Çamurluk', en: 'L.F. Wing' }, { pi: 0, tr: 'Kaput', en: 'Hood' }, { pi: 8, tr: 'Sağ Ön Çamurluk', en: 'R.F. Wing' }],
    [{ pi: 3, tr: 'Sol Ön Kapı', en: 'L.F. Door' }, { pi: 1, tr: 'Tavan', en: 'Roof' }, { pi: 4, tr: 'Sağ Ön Kapı', en: 'R.F. Door' }],
    [{ pi: 5, tr: 'Sol Arka Kapı', en: 'L.R. Door' }, null, { pi: 6, tr: 'Sağ Arka Kapı', en: 'R.R. Door' }],
    [{ pi: 9, tr: 'Sol Arka Çamurluk', en: 'L.R. Wing' }, { pi: 2, tr: 'Bagaj', en: 'Trunk' }, { pi: 10, tr: 'Sağ Arka Çamurluk', en: 'R.R. Wing' }],
];

export default function FinalBiDashboard() {
    const { lang } = useLang();
    const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
    const theme = useMemo(() => makeHybridTheme(), []);

    const [meta, setMeta] = useState<Rows['meta'] | null>(null);
    const [dict, setDict] = useState<Rows['dict'] | null>(null);
    const [agg, setAgg] = useState<Agg | null>(null);
    const [districts, setDistricts] = useState<{ name: string; n: number; median: number }[]>([]);
    const [damage, setDamage] = useState<{ parts: number[]; max: number; typeTotals: number[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [geoReady, setGeoReady] = useState(false);
    const [error, setError] = useState(false);
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);        // draft (edited by the filter bar)
    const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS); // committed on "Apply" → drives the fetch
    const [tab, setTab] = useState<'all' | 'pricing' | 'brands' | 'listings' | 'damage' | 'location'>('all');
    const [provName, setProvName] = useState<string | null>(null);
    const [mapMetric, setMapMetric] = useState<'count' | 'median'>('count');
    const [dmgType, setDmgType] = useState<number>(-1); // -1 any · 1 lokal · 2 boyalı · 3 değişen
    // raw text of the numeric range inputs — kept separate from the (scaled, rounded)
    // filter state so fractional/intermediate keystrokes ("1." , "1.5") never desync.
    const EMPTY_NUMSTR = { yearMin: '', yearMax: '', priceMin: '', priceMax: '', kmMin: '', kmMax: '' };
    const [numStr, setNumStr] = useState<Record<string, string>>(EMPTY_NUMSTR);
    const tabsRef = useRef<HTMLDivElement>(null);
    // switching tabs changes the page height (fewer/more cards); without this the browser
    // clamps the old scroll offset and the view appears to jump. Re-anchor to the tab bar.
    const goTab = (key: typeof tab) => { setTab(key); requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); };
    // in-place controls (map metric, damage type, province select) must never move the
    // scroll position — pin it across the re-render as a safety net.
    const keepScroll = (fn: () => void) => { const y = window.scrollY; fn(); requestAnimationFrame(() => window.scrollTo(0, y)); };

    // one-time: metadata + label dicts (dropdowns) + the Turkey geojson (static)
    useEffect(() => {
        let alive = true;
        Promise.all([
            carService.getBiMeta(),
            fetch('/geo/turkey-provinces.json').then((r) => r.json()),
        ])
            .then(([m, geo]: [{ meta: Rows['meta']; dict: Rows['dict'] }, any]) => {
                if (!alive) return;
                echarts.registerMap('turkey', geo);
                setMeta(m.meta);
                setDict(m.dict);
                setGeoReady(true);
                setProvName('İstanbul');
            })
            .catch(() => alive && setError(true));
        return () => { alive = false; };
    }, []);

    // server-side aggregation: refetch only when the APPLIED filters change (user pressed
    // "Apply"), or when the damage-type toggle / selected province change. Editing the
    // filter bar alone does NOT hit the API. The map-metric toggle stays client-only.
    useEffect(() => {
        if (!meta) return;
        let alive = true;
        setLoading(true);
        const t = setTimeout(() => {
            carService.getBiAgg(appliedFilters, dmgType, provName)
                .then((res) => { if (!alive) return; setAgg(res.agg); setDistricts(res.districts); setDamage(res.damage); setLoading(false); })
                .catch(() => { if (alive) { setError(true); setLoading(false); } });
        }, 200);
        return () => { alive = false; clearTimeout(t); };
    }, [meta, appliedFilters, dmgType, provName]);

    // has the user edited the filter bar without applying yet?
    const dirty = useMemo(() => JSON.stringify(filters) !== JSON.stringify(appliedFilters), [filters, appliedFilters]);
    const applyFilters = () => setAppliedFilters(filters);

    const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
    const setNum = (key: keyof Filters, str: string, scale: number) => {
        setNumStr((s) => ({ ...s, [key]: str }));
        const v = parseFloat(str);
        set({ [key]: str.trim() === '' || isNaN(v) ? null : Math.round(v * scale) } as Partial<Filters>);
    };
    const resetFilters = () => { setFilters(EMPTY_FILTERS); setNumStr(EMPTY_NUMSTR); setAppliedFilters(EMPTY_FILTERS); };

    // ---- formatting ----
    const loc = lang === 'tr' ? 'tr-TR' : 'en-US';
    const nf = (n: number) => n.toLocaleString(loc);
    const priceM = (n: number) => `₺${(n / 1e6).toFixed(2)}M`;
    const priceShort = (n: number) => (n >= 1e6 ? `₺${(n / 1e6).toFixed(2)}M` : `₺${Math.round(n / 1e3)}K`);
    // compact count that stays honest for small filtered sets (275 → "275", 1232 → "1.2K", 30042 → "30K")
    const kAbbr = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}K` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : nf(n));
    const kicker = L('Araç Fiyat Analitiği', 'Car Price Analytics');
    const title = L('Piyasa İstihbarat Raporu', 'Market Intelligence Report');

    if (error) return (
        <FinalShell active="dashboard" kicker={kicker} title={title}>
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-[#86857e]">
                <ServerCrash size={40} className="text-rose-500" />
                <p className="text-sm">{L('Veri yüklenemedi — API sunucusuna ulaşılamadı.', 'Could not load the dataset — the API backend is unreachable.')}</p>
            </div>
        </FinalShell>
    );
    if (!meta || !dict || !agg || !geoReady) return (
        <FinalShell active="dashboard" kicker={kicker} title={title}>
            <div className="flex items-center justify-center py-24 text-[#86857e]"><Loader2 className="animate-spin" size={28} /></div>
        </FinalShell>
    );

    // ---- shared chart tokens ----
    const MONO = theme.fontMono, FONT = theme.fontSans, gridC = theme.grid;
    const ax = { color: '#9a9a92', fontFamily: MONO, fontSize: 10 };
    const tip = { backgroundColor: theme.surface, borderColor: '#e4e2dd', borderWidth: 1, textStyle: { color: '#1a1a1a', fontFamily: FONT, fontSize: 11 }, padding: [7, 11] as [number, number] };
    const axisCommon = { axisLine: { lineStyle: { color: '#dcd9d2' } }, axisTick: { show: false }, axisLabel: ax, splitLine: { lineStyle: { color: gridC } } };
    const bare = { left: 2, right: 2, top: 6, bottom: 2 };
    const eOpts = { renderer: 'canvas' as const };
    const show = (member: string) => tab === 'all' || tab === member;

    // ---- KPI mini charts ----
    const sparkOpt = (vals: number[], color: string, area: boolean) => ({
        animation: false, grid: bare,
        xAxis: { type: 'category', show: false, boundaryGap: false, data: vals.map((_, i) => i) },
        yAxis: { type: 'value', show: false, scale: true },
        tooltip: { ...tip, trigger: 'axis', formatter: () => '' },
        series: [{ type: 'line', smooth: true, symbol: 'none', data: vals.length ? vals : [0, 0], lineStyle: { color, width: 2 }, areaStyle: area ? { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(5,150,105,0.22)' }, { offset: 1, color: 'rgba(5,150,105,0)' }]) } : undefined }],
    });
    const gaugeOpt = (val: number) => ({
        animation: false,
        series: [{ type: 'gauge', radius: '128%', center: ['50%', '82%'], startAngle: 180, endAngle: 0, min: 0, max: 100, progress: { show: true, width: 8, itemStyle: { color: GD } }, axisLine: { lineStyle: { width: 8, color: [[1, '#e7e4de']] } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, pointer: { show: false }, anchor: { show: false }, detail: { valueAnimation: false, offsetCenter: [0, '-8%'], fontFamily: MONO, fontSize: 15, fontWeight: 600, color: '#1a1a1a', formatter: '{value}%' }, data: [{ value: val }] }],
    });
    const k = agg.kpi;
    const kpiCards = [
        { label: L('Ortalama Fiyat', 'Average Price'), value: priceM(k.avgPrice), icon: Banknote, sub: L('medyan', 'median') + ' ' + priceM(k.medianPrice), chart: <ReactECharts option={sparkOpt(k.priceSpark, GD, true)} style={{ height: 44 }} opts={eOpts} notMerge />, foot: L('yıla göre ort. fiyat', 'avg price by year') },
        { label: L('Hasarsız Oran', 'Clean Rate'), value: `${k.cleanPct}%`, icon: ShieldCheck, sub: `${nf(agg.n - k.damagedN)} / ${nf(agg.n)}`, chart: <ReactECharts option={gaugeOpt(k.cleanPct)} style={{ height: 44 }} opts={eOpts} notMerge />, foot: L('ağır hasarsız ilan', 'no-heavy-damage listings') },
        { label: L('Medyan KM', 'Median Mileage'), value: nf(k.medianKm), icon: Gauge, sub: `${L('ort. yaş', 'avg age')} ${k.avgAge}`, chart: <ReactECharts option={sparkOpt(k.kmSpark, G, false)} style={{ height: 44 }} opts={eOpts} notMerge />, foot: L('yıla göre medyan km', 'median km by year') },
    ];

    // ---- chart options ----
    const segColor = (avg: number) => (avg < 1.3e6 ? '#bfe6d3' : avg > 2.2e6 ? GD : '#7fd0aa');
    const comboOpt = { animation: false,
        grid: { left: 40, right: 10, top: 24, bottom: 22 }, tooltip: { ...tip, trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (ps: any) => { const s = agg.segmentPrice[ps[0].dataIndex]; return `${s.seg} ${L('Segment', 'Segment')}<br/>${L('ort', 'avg')} ${priceM(s.avg)} · ${L('medyan', 'med')} ${priceM(s.median)}<br/>${nf(s.n)} ${L('ilan', 'listings')}`; } },
        xAxis: { type: 'category', data: agg.segmentPrice.map((s) => s.seg), ...axisCommon, splitLine: { show: false } },
        yAxis: { type: 'value', ...axisCommon, axisLabel: { ...ax, formatter: (v: number) => `${v.toFixed(1)}M` } },
        series: [
            { type: 'bar', barWidth: '52%', itemStyle: { borderRadius: [3, 3, 0, 0] }, data: agg.segmentPrice.map((s) => ({ value: +(s.avg / 1e6).toFixed(2), itemStyle: { color: segColor(s.avg) } })) },
            { type: 'line', smooth: true, symbol: 'circle', symbolSize: 4, data: agg.segmentPrice.map((s) => +(s.avg / 1e6).toFixed(2)), lineStyle: { color: '#1a1a1a', width: 1.5, opacity: 0.5 }, itemStyle: { color: '#1a1a1a' } },
        ],
    };
    const priceYearOpt = { animation: false,
        grid: { left: 44, right: 14, top: 16, bottom: 24 }, tooltip: { ...tip, trigger: 'axis', valueFormatter: (v: number) => priceM(v) },
        xAxis: { type: 'category', boundaryGap: false, data: agg.priceByYear.map((d) => d.year), ...axisCommon },
        yAxis: { type: 'value', scale: true, ...axisCommon, axisLabel: { ...ax, formatter: (v: number) => `${(v / 1e6).toFixed(1)}M` } },
        series: [{ type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, data: agg.priceByYear.map((d) => d.price), lineStyle: { color: G, width: 2.5 }, itemStyle: { color: G }, areaStyle: { color: G, opacity: 0.1 } }],
    };
    const volOpt = { animation: false,
        grid: { left: 34, right: 8, top: 10, bottom: 20 }, tooltip: { ...tip, trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (ps: any) => `${agg.dailyVolume.days[ps[0].dataIndex]?.slice(5)}<br/>${nf(ps[0].value)} ${L('ilan', 'listings')}` },
        xAxis: { type: 'category', data: agg.dailyVolume.days.map((_, i) => i), ...axisCommon, axisLabel: { show: false } },
        yAxis: { type: 'value', ...axisCommon }, series: [{ type: 'bar', barWidth: '62%', data: agg.dailyVolume.counts.map((v, i) => ({ value: v, itemStyle: { color: i === agg.dailyVolume.highlightIdx ? GD : '#bfe6d3', borderRadius: [2, 2, 0, 0] } })) }],
    };
    const fuelOpt = { animation: false,
        grid: { left: 34, right: 8, top: 8, bottom: 20 }, tooltip: { ...tip, trigger: 'axis', axisPointer: { type: 'shadow' } },
        xAxis: { type: 'category', data: agg.fuelYear.years, ...axisCommon }, yAxis: { type: 'value', ...axisCommon, axisLabel: { ...ax, formatter: (v: number) => `${v >= 1000 ? v / 1000 + 'k' : v}` } },
        series: agg.fuelYear.series.map((s) => ({ name: s.name, type: 'bar', data: s.data, itemStyle: { color: s.color, borderRadius: [2, 2, 0, 0] }, barGap: '12%', barCategoryGap: '34%' })),
    };
    const donutOpt = { animation: false,
        tooltip: { ...tip, trigger: 'item', formatter: (p: any) => `${p.name}<br/>${nf(p.value)} · ${p.percent}%` },
        legend: { bottom: 0, textStyle: { color: '#86857e', fontFamily: MONO, fontSize: 10 } },
        series: [{ type: 'pie', radius: ['45%', '70%'], center: ['50%', '44%'], itemStyle: { borderColor: theme.surface, borderWidth: 2 }, label: { show: false }, labelLine: { show: false }, data: agg.fuelDonut.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })) }],
    };
    const brandRangeOpt = { animation: false,
        grid: { left: 62, right: 18, top: 14, bottom: 24 }, tooltip: { ...tip, trigger: 'item', formatter: (p: any) => { const d = agg.brandRange[p.dataIndex]; if (!d) return ''; return `${d.brand}<br/>Max ${priceM(d.max)} · Q3 ${priceM(d.q3)}<br/>Med ${priceM(d.median)}<br/>Q1 ${priceM(d.q1)} · Min ${priceM(d.min)}`; } },
        xAxis: { type: 'value', ...axisCommon, axisLabel: { ...ax, formatter: (v: number) => `${(v / 1e6).toFixed(1)}M` } },
        yAxis: { type: 'category', data: agg.brandRange.map((d) => d.brand), ...axisCommon, splitLine: { show: false } },
        series: [
            { type: 'bar', stack: 'r', itemStyle: { color: 'transparent' }, data: agg.brandRange.map((d) => d.q1), barWidth: 12, silent: true },
            { type: 'bar', stack: 'r', barWidth: 12, itemStyle: { color: G, opacity: 0.35, borderRadius: 4 }, data: agg.brandRange.map((d) => d.q3 - d.q1) },
            { type: 'scatter', symbolSize: 9, itemStyle: { color: GD }, data: agg.brandRange.map((d) => [d.median, d.brand]) },
        ],
    };
    const dens = agg.density;
    const densOpt = { animation: false,
        grid: { top: 12, right: 14, bottom: 40, left: 42 }, tooltip: { ...tip, position: 'top', formatter: (p: any) => `${dens.xLabels[p.value[0]]} km · ₺${dens.yLabels[p.value[1]]}<br/>${nf(p.value[2])} ${L('ilan', 'listings')}` },
        xAxis: { type: 'category', data: dens.xLabels, ...axisCommon, splitLine: { show: false }, axisLabel: { ...ax, interval: 3 }, name: 'km', nameTextStyle: { color: '#9a9a92', fontSize: 9 } },
        yAxis: { type: 'category', data: dens.yLabels, ...axisCommon, splitLine: { show: false }, name: '₺', nameTextStyle: { color: '#9a9a92', fontSize: 9 } },
        visualMap: { min: 0, max: Math.max(1, dens.max), calculable: true, orient: 'horizontal', left: 'center', bottom: 4, itemWidth: 10, itemHeight: 80, textStyle: { color: '#86857e', fontSize: 9, fontFamily: MONO }, inRange: { color: GREEN_RAMP } },
        series: [{ type: 'heatmap', data: dens.data, emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.2)' } } }],
    };
    const scatterOpt = { animation: false,
        grid: { top: 14, right: 16, bottom: 34, left: 48 }, tooltip: { ...tip, trigger: 'item', formatter: (p: any) => `${p.seriesName}<br/>${(p.value[0] / 1000).toFixed(0)}k km · ${priceM(p.value[1])}` },
        legend: { top: 0, right: 0, textStyle: { color: '#86857e', fontFamily: MONO, fontSize: 10 } },
        xAxis: { type: 'value', name: 'km', ...axisCommon, axisLabel: { ...ax, formatter: (v: number) => `${(v / 1000).toFixed(0)}k` } },
        yAxis: { type: 'value', ...axisCommon, axisLabel: { ...ax, formatter: (v: number) => `${(v / 1e6).toFixed(1)}M` } },
        series: agg.scatter.map((s) => ({ name: s.brand, type: 'scatter', symbolSize: 5, itemStyle: { color: s.color, opacity: 0.5 }, data: s.points })),
    };

    // ---- ported EDA charts ----
    const histOpt = { animation: false,
        grid: { left: 40, right: 12, top: 14, bottom: 26 },
        tooltip: { ...tip, trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (ps: any) => `₺${agg.priceHist.labels[ps[0].dataIndex]}M<br/>${nf(ps[0].value)} ${L('ilan', 'listings')}` },
        xAxis: { type: 'category', data: agg.priceHist.labels, ...axisCommon, splitLine: { show: false }, axisLabel: { ...ax, interval: 1 } },
        yAxis: { type: 'value', ...axisCommon },
        series: [{ type: 'bar', data: agg.priceHist.counts, itemStyle: { color: G, borderRadius: [3, 3, 0, 0] } }],
    };
    const bodyOpt = { animation: false,
        grid: { left: 44, right: 12, top: 14, bottom: 48 },
        tooltip: { ...tip, trigger: 'item', formatter: (p: any) => { const b = agg.bodyBox[p.dataIndex]; if (!b) return ''; return `${LBL.label(LBL.bodyType, b.body, lang)}<br/>${L('medyan', 'med')} ${priceM(b.median)}<br/>Q1 ${priceM(b.q1)} · Q3 ${priceM(b.q3)}<br/>${nf(b.n)} ${L('ilan', 'listings')}`; } },
        xAxis: { type: 'category', data: agg.bodyBox.map((b) => LBL.label(LBL.bodyType, b.body, lang)), ...axisCommon, splitLine: { show: false }, axisLabel: { ...ax, rotate: 30 } },
        yAxis: { type: 'value', ...axisCommon, axisLabel: { ...ax, formatter: (v: number) => `${(v / 1e6).toFixed(1)}M` } },
        series: [{ type: 'boxplot', data: agg.bodyBox.map((b) => [b.min, b.q1, b.median, b.q3, b.max]), itemStyle: { color: '#eef0ee', borderColor: GD, borderWidth: 1.5 } }],
    };
    const dmgImpactOpt = { animation: false,
        grid: { left: 44, right: 12, top: 22, bottom: 24 },
        tooltip: { ...tip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => priceM(v) },
        xAxis: { type: 'category', data: [L('Temiz', 'Clean'), L('Ağır hasarlı', 'Heavy dmg')], ...axisCommon },
        yAxis: { type: 'value', ...axisCommon, axisLabel: { ...ax, formatter: (v: number) => `${(v / 1e6).toFixed(1)}M` } },
        series: [{ type: 'bar', barWidth: '46%', itemStyle: { borderRadius: [4, 4, 0, 0] }, label: { show: true, position: 'top', formatter: (p: any) => priceM(p.value), color: '#86857e', fontFamily: MONO, fontSize: 10 }, data: [{ value: agg.damageImpact.clean, itemStyle: { color: G } }, { value: agg.damageImpact.damaged, itemStyle: { color: '#ef4444' } }] }],
    };
    const dmgSegOpt = { animation: false,
        grid: { left: 34, right: 14, top: 20, bottom: 24 },
        tooltip: { ...tip, trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (ps: any) => { const d = agg.damageBySeg[ps[0].dataIndex]; return `${d.seg} ${L('Segment', 'Segment')}<br/>%${d.pct} ${L('ağır hasarlı', 'heavy-damaged')}<br/>${nf(d.damaged)} / ${nf(d.n)}`; } },
        xAxis: { type: 'category', data: agg.damageBySeg.map((d) => d.seg), ...axisCommon, splitLine: { show: false } },
        yAxis: { type: 'value', ...axisCommon, axisLabel: { ...ax, formatter: (v: number) => `%${v}` } },
        series: [{ type: 'bar', barWidth: '52%', itemStyle: { color: '#e08a1e', borderRadius: [3, 3, 0, 0] }, label: { show: true, position: 'top', formatter: (p: any) => `%${p.value}`, color: '#86857e', fontFamily: MONO, fontSize: 10 }, data: agg.damageBySeg.map((d) => d.pct) }],
    };

    // ---- Turkey map ----
    const provList = agg.provinces;
    const provByName = new Map(provList.map((p) => [p.name, p]));
    // full province list for the dropdown (all cities in the dataset, TR-sorted) — a
    // keyboard/mobile-friendly alternative to clicking the map. Same names the map uses.
    const provNames = [...dict.city].sort((a, b) => a.localeCompare(b, 'tr'));
    const metricVal = (p: { n: number; median: number }) => (mapMetric === 'count' ? p.n : p.median);
    const scaleMax = mapMetric === 'count' ? (provList[2]?.n ?? agg.provMax) : Math.max(1, ...provList.map((p) => p.median));
    const scaleMin = mapMetric === 'count' ? 0 : Math.min(...provList.map((p) => p.median), 0);
    const mapOpt = { animation: false,
        tooltip: { ...tip, trigger: 'item', formatter: (p: any) => { const row = provByName.get(p.name); if (!row) return `${p.name}<br/>${L('bu filtrede veri yok', 'no data in this filter')}`; return `<b>${p.name}</b><br/>${nf(row.n)} ${L('ilan', 'listings')} · ${L('medyan', 'median')} ${priceShort(row.median)}`; } },
        visualMap: { type: 'continuous', min: scaleMin, max: scaleMax, calculable: true, left: 6, bottom: 6, itemWidth: 10, itemHeight: 92, orient: 'vertical', text: [L('yüksek', 'high'), ''], textStyle: { color: '#86857e', fontSize: 9, fontFamily: MONO }, inRange: { color: GREEN_RAMP }, formatter: (v: number) => (mapMetric === 'count' ? nf(Math.round(v)) : priceShort(v)) },
        series: [{
            type: 'map', map: 'turkey', roam: false, layoutCenter: ['50%', '54%'], layoutSize: '132%', aspectScale: 0.68,
            itemStyle: { borderColor: '#e9e7e2', borderWidth: 0.6, areaColor: '#f3f1ec' },
            label: { show: false },
            emphasis: { label: { show: true, color: '#1a1a1a', fontFamily: MONO, fontSize: 10 }, itemStyle: { areaColor: '#7fd0aa' } },
            select: { label: { show: true, color: '#1a1a1a', fontFamily: MONO, fontSize: 10, fontWeight: 'bold' as const }, itemStyle: { areaColor: GD } },
            selectedMode: 'single' as const,
            data: provList.map((p) => ({ name: p.name, value: metricVal(p), selected: p.name === provName })),
        }],
    };
    const onMapClick = (p: any) => { if (p?.name) keepScroll(() => setProvName(p.name)); };
    const provRow = provName ? provByName.get(provName) : undefined;
    const distMax = Math.max(1, ...districts.map((x) => x.n));

    // ---- tabs / building blocks ----
    const tabDefs = [
        { key: 'all', label: L('Genel Bakış', 'Overview') },
        { key: 'pricing', label: L('Fiyat', 'Pricing') },
        { key: 'brands', label: L('Seri & Yakıt', 'Brands & Fuel') },
        { key: 'listings', label: L('İlanlar', 'Listings') },
        { key: 'damage', label: L('Hasar', 'Damage') },
        { key: 'location', label: L('Konum', 'Location') },
    ] as const;
    const cardCls = 'rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9]';
    const Card = ({ span, children, cls = '' }: { span: string; children: React.ReactNode; cls?: string }) => (
        <div className={`${cardCls} ${span} ${cls}`}>{children}</div>
    );
    const CTitle = ({ t, s }: { t: string; s?: string }) => (
        <><div className="text-[13px] font-semibold text-[#1a1a1a]">{t}</div>{s ? <div className="mt-0.5 text-[11px] leading-snug text-[#86857e]">{s}</div> : null}</>
    );
    const activeFilters = filters.brand >= 0 || filters.series >= 0 || filters.fuel >= 0 || filters.seg >= 0 || filters.damage >= 0 ||
        filters.yearMin != null || filters.yearMax != null || filters.priceMin != null || filters.priceMax != null || filters.kmMin != null || filters.kmMax != null;

    const seriesOptions = dict.series.map((s, i) => ({ i, ...s })).filter((s) => filters.brand < 0 || s.b === filters.brand);
    const selCls = 'rounded-[8px] border border-[#d8d6d0] bg-[#fdfcf9] px-2 py-[6px] font-mono text-[12px] text-[#5f5f5a] focus:border-[#047857] focus:outline-none';
    const numCls = 'w-[58px] rounded-[8px] border border-[#d8d6d0] bg-[#fdfcf9] px-2 py-[6px] font-mono text-[12px] text-[#5f5f5a] focus:border-[#047857] focus:outline-none';

    return (
        <FinalShell active="dashboard" kicker={kicker} title={title} meta={L(`BMW + Audi · ${nf(meta.n_unique)} ilan · canlı filtre`, `BMW + Audi · ${nf(meta.n_unique)} listings · live filters`)}>
            {/* filter bar — edits stay local; the API is hit only on Apply (or Enter) */}
            <div className="mb-4 rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-3" onKeyDown={(e) => { if (e.key === 'Enter' && dirty) applyFilters(); }}>
                <div className="flex flex-wrap items-center gap-2.5">
                    <select className={selCls} value={filters.brand} onChange={(e) => set({ brand: +e.target.value, series: -1 })}>
                        <option value={-1}>{L('Tüm markalar', 'All brands')}</option><option value={0}>BMW</option><option value={1}>Audi</option>
                    </select>
                    <select className={selCls} value={filters.series} onChange={(e) => set({ series: +e.target.value })}>
                        <option value={-1}>{L('Tüm seriler', 'All series')}</option>
                        {seriesOptions.map((s) => <option key={s.i} value={s.i}>{s.name}{filters.brand < 0 ? ` · ${meta.brands[s.b]}` : ''}</option>)}
                    </select>
                    <select className={selCls} value={filters.fuel} onChange={(e) => set({ fuel: +e.target.value })}>
                        <option value={-1}>{L('Tüm yakıtlar', 'All fuels')}</option>
                        {/* FUEL holds the Turkish join keys from bi_rows.json — display-translate only. */}
                        {FUEL.map((f, i) => <option key={f} value={i}>{LBL.label(LBL.fuel, f, lang)}</option>)}
                    </select>
                    <select className={selCls} value={filters.seg} onChange={(e) => set({ seg: +e.target.value })}>
                        <option value={-1}>{L('Tüm segmentler', 'All segments')}</option>
                        {SEG.map((s, i) => <option key={s} value={i}>{s}</option>)}
                    </select>
                    <select className={selCls} value={filters.damage} onChange={(e) => set({ damage: +e.target.value })}>
                        <option value={-1}>{L('Hasar: hepsi', 'Damage: any')}</option><option value={0}>{L('Temiz', 'Clean')}</option><option value={1}>{L('Ağır hasarlı', 'Heavy damaged')}</option>
                    </select>
                    <span className="flex items-center gap-1"><span className="font-mono text-[10px] uppercase text-[#9a9a92]">{L('Yıl', 'Year')}</span>
                        <input className={numCls} type="number" placeholder="min" value={numStr.yearMin} onChange={(e) => setNum('yearMin', e.target.value, 1)} />
                        <input className={numCls} type="number" placeholder="max" value={numStr.yearMax} onChange={(e) => setNum('yearMax', e.target.value, 1)} />
                    </span>
                    <span className="flex items-center gap-1"><span className="font-mono text-[10px] uppercase text-[#9a9a92]">{L('₺M', '₺M')}</span>
                        <input className={numCls} type="number" step="0.1" placeholder="min" value={numStr.priceMin} onChange={(e) => setNum('priceMin', e.target.value, 1e6)} />
                        <input className={numCls} type="number" step="0.1" placeholder="max" value={numStr.priceMax} onChange={(e) => setNum('priceMax', e.target.value, 1e6)} />
                    </span>
                    <span className="flex items-center gap-1"><span className="font-mono text-[10px] uppercase text-[#9a9a92]">{L('KMk', 'KMk')}</span>
                        <input className={numCls} type="number" step="10" placeholder="min" value={numStr.kmMin} onChange={(e) => setNum('kmMin', e.target.value, 1000)} />
                        <input className={numCls} type="number" step="10" placeholder="max" value={numStr.kmMax} onChange={(e) => setNum('kmMax', e.target.value, 1000)} />
                    </span>
                    <span className="ml-auto flex items-center gap-2.5">
                        {loading && <Loader2 className="animate-spin text-[#86857e]" size={13} />}
                        <span className="font-mono text-[12px] text-[#5f5f5a]"><b className="text-[#047857]">{nf(agg.n)}</b> {L('ilan', 'listings')}</span>
                        <button type="button" onClick={applyFilters} disabled={!dirty}
                            className={`flex items-center gap-1.5 rounded-[8px] px-3 py-[6px] font-mono text-[11px] transition-colors ${dirty ? 'bg-[#047857] text-white hover:bg-[#036249]' : 'cursor-default bg-[#eceae4] text-[#b3b2ab]'}`}>
                            <Filter size={12} /> {L('Uygula', 'Apply')}
                        </button>
                        {activeFilters && (
                            <button type="button" onClick={resetFilters} className="flex items-center gap-1.5 rounded-[8px] bg-[#1a1a1a] px-3 py-[6px] font-mono text-[11px] text-[#f7f6f3] hover:bg-black">
                                <RotateCcw size={12} /> {L('Sıfırla', 'Reset')}
                            </button>
                        )}
                    </span>
                </div>
            </div>

            {/* scope chips */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-[8px] border border-[#d8d6d0] bg-[#fdfcf9] px-3 py-[6px] font-mono text-[11px] text-[#5f5f5a]">{L('Oca–Haz 2026', 'Jan–Jun 2026')}</span>
                <span className="ml-auto rounded-[8px] bg-[#e7f3ec] px-3 py-[6px] font-mono text-[11px] font-medium text-[#047857]">{nf(meta.n_unique)} {L('tekil ilan', 'unique listings')}</span>
            </div>

            {/* tab bar */}
            <div ref={tabsRef} className="mb-[18px] flex gap-1 overflow-x-auto scroll-mt-[64px] border-b border-[#e9e7e2] md:scroll-mt-3 [&::-webkit-scrollbar]:hidden">
                {tabDefs.map((tb) => {
                    const on = tab === tb.key;
                    return <button type="button" key={tb.key} onClick={() => goTab(tb.key)} className={`-mb-px whitespace-nowrap rounded-t-[7px] px-4 py-[9px] text-[13px] font-semibold transition-colors ${on ? 'border-b-2 border-[#047857] bg-[#e7f3ec] text-[#047857]' : 'border-b-2 border-transparent text-[#5f5f5a] hover:bg-[#f1efe9]'}`}>{tb.label}</button>;
                })}
            </div>

            {agg.n === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-20 text-center text-[#86857e]">
                    <p className="text-sm">{L('Bu filtrelerle eşleşen ilan yok.', 'No listings match these filters.')}</p>
                    <button type="button" onClick={resetFilters} className="font-mono text-[12px] text-[#047857] underline">{L('Filtreleri sıfırla', 'Reset filters')}</button>
                </div>
            ) : (
                <div className="grid grid-cols-2 items-start gap-[14px] md:grid-cols-12">

                    {/* KPI cards + green strip (always) */}
                    {kpiCards.map((c) => (
                        <Card key={c.label} span="col-span-1 md:col-span-4 xl:col-span-3" cls="px-[14px] pb-[10px] pt-[14px]">
                            <div className="mb-2 flex items-center gap-[7px]"><c.icon size={14} className="text-[#86857e]" strokeWidth={2} /><span className="text-[11px] font-medium text-[#5f5f5a]">{c.label}</span></div>
                            <div className="text-[23px] font-bold tracking-[-0.04em] text-[#1a1a1a]">{c.value}</div>
                            <div className="mt-0.5 font-mono text-[11px] text-[#86857e]">{c.sub}</div>
                            <div className="mt-1.5 h-[44px] w-full">{c.chart}</div>
                            <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.04em] text-[#b3b2ab]">{c.foot}</div>
                        </Card>
                    ))}
                    <Card span="col-span-2 md:col-span-12 xl:col-span-3" cls="flex items-center justify-between gap-3 !bg-[#047857] px-[18px] py-[14px]">
                        {[[priceM(k.medianPrice), L('Medyan Fiyat', 'Median Price')], [`${k.avgAge}`, L('Ort. Yaş', 'Avg Age')], [kAbbr(agg.n), L('İlan', 'Listings')]].map(([v, l], i) => (
                            <div key={l} className={i === 0 ? 'text-left' : i === 2 ? 'text-right' : 'text-center'}>
                                <div className="text-[19px] font-bold tracking-[-0.035em] text-[#f7f6f3]">{v}</div>
                                <div className="mt-[3px] font-mono text-[9px] uppercase tracking-[0.05em] text-[#a7e8cf]">{l}</div>
                            </div>
                        ))}
                    </Card>

                    {/* combo — pricing */}
                    {show('pricing') && (
                        <Card span="col-span-2 md:col-span-6" cls="px-5 pb-3 pt-[18px]">
                            <CTitle t={L('Segmente Göre Ortalama Fiyat', 'Average Price by Segment')} s={L('Filtrelenen ilanlarda B–S segment ortalama fiyatı + trend.', 'Avg price across B–S segments for the filtered set, with trend.')} />
                            <div className="mt-1 h-[200px] w-full"><ReactECharts option={comboOpt} style={{ height: '100%', width: '100%' }} opts={eOpts} notMerge /></div>
                        </Card>
                    )}
                    {/* daily volume — listings */}
                    {show('listings') && (
                        <Card span="col-span-2 md:col-span-6" cls="px-[18px] pb-3 pt-4">
                            <CTitle t={L('Günlük İlan Hacmi', 'Daily Listing Volume')} s={L('Son 15 gün.', 'Last 15 days.')} />
                            <div className="mt-2 h-[150px] w-full"><ReactECharts option={volOpt} style={{ height: '100%', width: '100%' }} opts={eOpts} notMerge /></div>
                            <div className="mt-1 flex gap-5 border-t border-[#ece9e3] pt-2.5">
                                <div><div className="text-[15px] font-bold tracking-[-0.03em] text-[#1a1a1a]">{nf(agg.dailyVolume.thisWeek)}</div><div className="font-mono text-[10px] uppercase text-[#86857e]">{L('Bu hafta', 'This week')}</div></div>
                                <div><div className="text-[15px] font-bold tracking-[-0.03em] text-[#5f5f5a]">{nf(agg.dailyVolume.lastWeek)}</div><div className="font-mono text-[10px] uppercase text-[#86857e]">{L('Geçen hafta', 'Last week')}</div></div>
                            </div>
                        </Card>
                    )}

                    {/* matrix — brands */}
                    {show('brands') && (
                        <Card span="col-span-2 md:col-span-12" cls="overflow-x-auto px-[18px] pb-[14px] pt-4">
                            <CTitle t={L('Seri × Model Yılı', 'Listings by Series × Year')} s={L('En çok ilanı olan 7 seri, yıl aralıklarına göre; satır toplamlı.', 'Top-7 series by year band, with row totals.')} />
                            <div className="mt-3 min-w-[540px]">
                                <div className="grid rounded-t-[6px] border-b border-[#dce6e0] bg-[#eef3f0]" style={{ gridTemplateColumns: `132px repeat(${agg.matrix.buckets.length},1fr) 66px` }}>
                                    <span className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.05em] text-[#3d6b57]">{L('Seri', 'Series')}</span>
                                    {agg.matrix.buckets.map((b) => <span key={b} className="px-1 py-2 text-right font-mono text-[10px] text-[#3d6b57]">{b}</span>)}
                                    <span className="px-2 py-2 text-right font-mono text-[10px] uppercase text-[#3d6b57]">{L('Top.', 'Total')}</span>
                                </div>
                                {agg.matrix.rows.map((r, i) => (
                                    <div key={r.series + r.brand} className="grid border-b border-[#f0eee9]" style={{ gridTemplateColumns: `132px repeat(${agg.matrix.buckets.length},1fr) 66px`, background: i % 2 === 0 ? '#fdfcf9' : '#f7f6f3' }}>
                                        <span className="truncate px-3 py-[7px] text-[12px] font-medium text-[#1a1a1a]">{r.series}<span className="ml-1 text-[10px] text-[#9a9a92]">{r.brand}</span></span>
                                        {r.cells.map((c, ci) => <span key={ci} className="px-1 py-[7px] text-right font-mono text-[11.5px] tabular-nums text-[#5f5f5a]">{nf(c)}</span>)}
                                        <span className="px-2 py-[7px] text-right font-mono text-[11.5px] font-semibold tabular-nums text-[#1a1a1a]">{nf(r.total)}</span>
                                    </div>
                                ))}
                                <div className="grid rounded-b-[6px] bg-[#eef3f0]" style={{ gridTemplateColumns: `132px repeat(${agg.matrix.buckets.length},1fr) 66px` }}>
                                    <span className="px-3 py-[7px] text-[12px] font-bold text-[#1a1a1a]">{L('Toplam', 'Total')}</span>
                                    {agg.matrix.colTotals.map((c, ci) => <span key={ci} className="px-1 py-[7px] text-right font-mono text-[11.5px] font-bold tabular-nums text-[#1a1a1a]">{nf(c)}</span>)}
                                    <span className="px-2 py-[7px] text-right font-mono text-[11.5px] font-bold tabular-nums text-[#047857]">{nf(agg.matrix.grandTotal)}</span>
                                </div>
                            </div>
                        </Card>
                    )}
                    {/* fuel × year — brands */}
                    {show('brands') && (
                        <Card span="col-span-2 md:col-span-6" cls="px-[18px] pb-3 pt-4">
                            <CTitle t={L('Yakıt × Yıl', 'Fuel × Year')} />
                            <div className="mt-2 flex flex-wrap gap-3">{agg.fuelYear.series.map((f) => <div key={f.name} className="flex items-center gap-1.5"><span className="h-[9px] w-[9px] rounded-[2px]" style={{ background: f.color }} /><span className="font-mono text-[10px] text-[#5f5f5a]">{f.name}</span></div>)}</div>
                            <div className="mt-1.5 h-[150px] w-full"><ReactECharts option={fuelOpt} style={{ height: '100%', width: '100%' }} opts={eOpts} notMerge /></div>
                        </Card>
                    )}

                    {/* price by year — pricing */}
                    {show('pricing') && (
                        <Card span="col-span-2 md:col-span-6" cls="px-[18px] pb-3 pt-4">
                            <CTitle t={L('Yıla Göre Ortalama Fiyat', 'Average Price by Year')} s={L('Model yılına göre ortalama ilan fiyatı.', 'Average listing price by model year.')} />
                            <div className="mt-2 h-[210px] w-full"><ReactECharts option={priceYearOpt} style={{ height: '100%', width: '100%' }} opts={eOpts} notMerge /></div>
                        </Card>
                    )}
                    {/* price histogram (EDA) — pricing */}
                    {show('pricing') && (
                        <Card span="col-span-2 md:col-span-6" cls="px-[18px] pb-3 pt-4">
                            <CTitle t={L('Fiyat Dağılımı', 'Price Distribution')} s={L('₺M kovalarına göre ilan sayısı.', 'Listing count by ₺M bucket.')} />
                            <div className="mt-2 h-[210px] w-full"><ReactECharts option={histOpt} style={{ height: '100%', width: '100%' }} opts={eOpts} notMerge /></div>
                        </Card>
                    )}
                    {/* fuel donut — brands */}
                    {show('brands') && (
                        <Card span="col-span-2 md:col-span-6" cls="px-[18px] pb-3 pt-4">
                            <CTitle t={L('Yakıt Dağılımı', 'Fuel Distribution')} s={L('Pazar payı.', 'Market share.')} />
                            <div className="mt-1 h-[210px] w-full"><ReactECharts option={donutOpt} style={{ height: '100%', width: '100%' }} opts={eOpts} notMerge /></div>
                        </Card>
                    )}
                    {/* density heatmap — pricing */}
                    {show('pricing') && (
                        <Card span="col-span-2 md:col-span-6" cls="px-[18px] pb-3 pt-4">
                            <CTitle t={L('KM × Fiyat Yoğunluğu', 'Mileage × Price Density')} s={L('İlan yoğunluğu ısı haritası.', 'Listing density heatmap.')} />
                            <div className="mt-2 h-[300px] w-full"><ReactECharts option={densOpt} style={{ height: '100%', width: '100%' }} opts={eOpts} notMerge /></div>
                        </Card>
                    )}
                    {/* price by body type boxplot (EDA) — pricing */}
                    {show('pricing') && (
                        <Card span="col-span-2 md:col-span-6" cls="px-[18px] pb-3 pt-4">
                            <CTitle t={L('Kasa Tipine Göre Fiyat', 'Price by Body Type')} s={L('Min · Q1 · medyan · Q3 · max (₺M).', 'Min · Q1 · median · Q3 · max (₺M).')} />
                            <div className="mt-2 h-[300px] w-full"><ReactECharts option={bodyOpt} style={{ height: '100%', width: '100%' }} opts={eOpts} notMerge /></div>
                        </Card>
                    )}

                    {/* scatter — pricing */}
                    {show('pricing') && (
                        <Card span="col-span-2 md:col-span-6" cls="px-[18px] pb-3 pt-4">
                            <CTitle t={L('KM vs Fiyat', 'Mileage vs Price')} s={L('Örneklenmiş dağılım (marka rengi).', 'Sampled scatter, colored by brand.')} />
                            <div className="mt-1 h-[300px] w-full"><ReactECharts option={scatterOpt} style={{ height: '100%', width: '100%' }} opts={eOpts} notMerge /></div>
                        </Card>
                    )}
                    {/* brand range — pricing */}
                    {show('pricing') && (
                        <Card span="col-span-2 md:col-span-6" cls="px-[18px] pb-3 pt-4">
                            <CTitle t={L('Markaya Göre Fiyat Aralığı', 'Price Range by Brand')} s={L('Q1 · medyan · Q3.', 'Q1 · median · Q3.')} />
                            <div className="mt-1 h-[300px] w-full"><ReactECharts option={brandRangeOpt} style={{ height: '100%', width: '100%' }} opts={eOpts} notMerge /></div>
                        </Card>
                    )}

                    {/* recent listings — listings */}
                    {show('listings') && (
                        <Card span="col-span-2 md:col-span-12" cls="overflow-x-auto px-[18px] pb-[14px] pt-4">
                            <div className="mb-3 flex items-baseline justify-between">
                                <CTitle t={L('Son İlanlar', 'Recent Listings')} s={L('En yeni kayıtlar.', 'Latest records.')} />
                                <span className="font-mono text-[11px] text-[#86857e]">{L(`${agg.recent.length} / ${nf(agg.n)} gösteriliyor`, `showing ${agg.recent.length} of ${nf(agg.n)}`)}</span>
                            </div>
                            <div className="min-w-[640px]">
                                <div className="grid rounded-t-[6px] bg-[#1a1a1a]" style={{ gridTemplateColumns: '28px 1fr 1.2fr 44px 84px 66px 90px 72px 92px' }}>
                                    {[['#', 'left'], [L('Marka', 'Brand'), 'left'], [L('Model', 'Model'), 'left'], [L('Yıl', 'Year'), 'left'], [L('KM', 'Mileage'), 'right'], [L('Yakıt', 'Fuel'), 'left'], [L('İl', 'City'), 'left'], [L('Hasar', 'Damage'), 'center'], [L('Fiyat', 'Price'), 'right']].map(([lb, al], i) => <span key={i} className="px-2 py-2 font-mono text-[9.5px] uppercase tracking-[0.04em] text-[#c9c8c2]" style={{ textAlign: al as any }}>{lb}</span>)}
                                </div>
                                {agg.recent.map((r, i) => (
                                    <div key={r.id} className="grid border-b border-[#f0eee9]" style={{ gridTemplateColumns: '28px 1fr 1.2fr 44px 84px 66px 90px 72px 92px', background: i % 2 === 0 ? '#fdfcf9' : '#f7f6f3' }}>
                                        <span className="px-2 py-[6.5px] font-mono text-[11px] text-[#9a9a92]">{r.id}</span>
                                        <span className="px-2 py-[6.5px] text-[11.5px] font-semibold text-[#1a1a1a]">{r.brand}</span>
                                        <span className="truncate px-2 py-[6.5px] text-[11.5px] text-[#5f5f5a]">{r.model}</span>
                                        <span className="px-2 py-[6.5px] font-mono text-[11px] text-[#5f5f5a]">{r.year > 0 ? r.year : '—'}</span>
                                        <span className="px-2 py-[6.5px] text-right font-mono text-[11px] tabular-nums text-[#5f5f5a]">{r.km >= 0 ? nf(r.km) : '—'}</span>
                                        <span className="px-2 py-[6.5px] text-[11px] text-[#5f5f5a]">{r.fuel}</span>
                                        <span className="truncate px-2 py-[6.5px] text-[11px] text-[#5f5f5a]">{r.city}</span>
                                        <span className="px-2 py-[6.5px] text-center"><span className="inline-block rounded-[20px] px-[7px] py-[2px] font-mono text-[9.5px] font-semibold" style={{ color: r.damaged ? '#b91c1c' : '#047857', background: r.damaged ? '#fdecec' : '#e7f3ec' }}>{r.damaged ? L('Hasarlı', 'Damaged') : L('Temiz', 'Clean')}</span></span>
                                        <span className="px-2 py-[6.5px] text-right font-mono text-[11.5px] font-semibold tabular-nums text-[#1a1a1a]">{priceM(r.price)}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* damage — damage */}
                    {show('damage') && damage && (
                        <Card span="col-span-2 md:col-span-12" cls="px-5 pb-5 pt-[18px]">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div className="flex items-start gap-2"><Wrench size={16} className="mt-0.5 text-[#047857]" strokeWidth={2} /><CTitle t={L('Hasar Isı Haritası — Parça Bazında', 'Damage Heatmap — by Body Part')} s={L('Filtrelenen ilanlarda parça başına hasar sayısı.', 'Damage count per body part for the filtered set.')} /></div>
                                <div className="flex gap-1 rounded-[8px] border border-[#e4e2dd] bg-[#f7f6f3] p-0.5">
                                    {([[-1, L('Hepsi', 'Any')], [3, L('Değişen', 'Changed')], [2, L('Boyalı', 'Painted')], [1, L('Lokal', 'Local')]] as const).map(([t, lb]) => (
                                        <button type="button" key={t} onClick={() => keepScroll(() => setDmgType(t))} className={`rounded-[6px] px-3 py-1.5 font-mono text-[11px] transition-colors ${dmgType === t ? 'bg-[#047857] text-white' : 'text-[#5f5f5a] hover:bg-[#f1efe9]'}`}>{lb}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                                {/* car top-view grid */}
                                <div className="flex flex-col items-center justify-center rounded-[10px] border border-[#ece9e3] bg-[#faf9f6] py-5">
                                    <div className="flex flex-col gap-3">
                                        {DMG_LAYOUT.map((row, ri) => (
                                            <div key={ri} className="flex justify-center gap-3">
                                                {row.map((cell, ci) => {
                                                    if (!cell) return <div key={ci} className="h-[54px] w-20 sm:w-24" />;
                                                    const val = damage.parts[cell.pi];
                                                    const t = damage.max > 0 ? val / damage.max : 0;
                                                    const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
                                                    const bg = val > 0 ? `rgb(${lerp(231, 4)}, ${lerp(243, 120)}, ${lerp(236, 87)})` : '#f3f1ec';
                                                    const fg = t > 0.5 ? '#fff' : (val > 0 ? '#047857' : '#9a9a92');
                                                    return (
                                                        <div key={ci} title={`${L(cell.tr, cell.en)}: ${nf(val)}`} className="flex h-[54px] w-20 sm:w-24 flex-col items-center justify-center gap-0.5 rounded-[10px] text-center transition-transform hover:scale-105" style={{ background: bg }}>
                                                            <span className="text-[9.5px] font-medium leading-tight" style={{ color: fg }}>{L(cell.tr, cell.en)}</span>
                                                            {val > 0 && <span className="font-mono text-[13px] font-bold" style={{ color: fg }}>{val > 999 ? `${(val / 1000).toFixed(1)}k` : val}</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-5 flex items-center gap-2.5">
                                        <span className="font-mono text-[10px] text-[#86857e]">{L('az', 'low')}</span>
                                        <div className="h-2 w-[130px] rounded-[5px]" style={{ background: 'linear-gradient(90deg,#e7f3ec,#7fd0aa,#047857)' }} />
                                        <span className="font-mono text-[10px] text-[#86857e]">{L('çok', 'high')}</span>
                                    </div>
                                </div>
                                {/* damage stats */}
                                <div className="flex flex-col gap-3">
                                    {[[`${(100 * agg.kpi.damagedN / agg.n).toFixed(1)}%`, L('ağır hasarlı ilan', 'heavy-damaged listings'), `${nf(agg.kpi.damagedN)} / ${nf(agg.n)}`],
                                    [priceShort(meta.tramer_avg), L('ort. tramer (genel)', 'avg tramer (overall)'), `${nf(meta.tramer_n)} ${L('ilan', 'listings')}`]].map(([v, l, s]) => (
                                        <div key={l} className="rounded-[10px] border border-[#ece9e3] bg-[#fdfcf9] p-3.5">
                                            <div className="text-[22px] font-bold tracking-[-0.03em] text-[#1a1a1a]">{v}</div>
                                            <div className="mt-0.5 text-[11px] text-[#5f5f5a]">{l}</div>
                                            <div className="mt-1 font-mono text-[10px] text-[#9a9a92]">{s}</div>
                                        </div>
                                    ))}
                                    <div className="rounded-[10px] border border-[#ece9e3] bg-[#fdfcf9] p-3.5">
                                        <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.04em] text-[#86857e]">{L('Hasar türü (parça-adet)', 'Damage type (part-count)')}</div>
                                        {[[3, L('Değişen', 'Changed'), '#b91c1c'], [2, L('Boyalı', 'Painted'), '#e08a1e'], [1, L('Lokal boyalı', 'Local paint'), '#0d9aba']].map(([code, lb, col]) => (
                                            <div key={code as number} className="flex items-center justify-between py-[3px]"><span className="flex items-center gap-1.5"><span className="h-[8px] w-[8px] rounded-[2px]" style={{ background: col as string }} /><span className="text-[11.5px] text-[#5f5f5a]">{lb}</span></span><span className="font-mono text-[11px] tabular-nums text-[#1a1a1a]">{nf(damage.typeTotals[code as number])}</span></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* heavy-damage price impact (EDA) — damage */}
                    {show('damage') && (
                        <Card span="col-span-2 md:col-span-6" cls="px-[18px] pb-3 pt-4">
                            <CTitle t={L('Ağır Hasarın Fiyat Etkisi', 'Heavy-Damage Price Impact')} s={L(`Temiz (${nf(agg.damageImpact.cleanN)}) vs ağır hasarlı (${nf(agg.damageImpact.damagedN)}) ortalama fiyat.`, `Clean (${nf(agg.damageImpact.cleanN)}) vs heavy-damaged (${nf(agg.damageImpact.damagedN)}) average price.`)} />
                            <div className="mt-2 h-[210px] w-full"><ReactECharts option={dmgImpactOpt} style={{ height: '100%', width: '100%' }} opts={eOpts} notMerge /></div>
                        </Card>
                    )}
                    {/* heavy-damage rate by segment — damage (pairs with the impact card) */}
                    {show('damage') && (
                        <Card span="col-span-2 md:col-span-6" cls="px-[18px] pb-3 pt-4">
                            <CTitle t={L('Segmente Göre Ağır Hasar Oranı', 'Heavy-Damage Rate by Segment')} s={L('Her segmentte ağır hasarlı ilan yüzdesi.', 'Share of heavy-damaged listings per segment.')} />
                            <div className="mt-2 h-[210px] w-full"><ReactECharts option={dmgSegOpt} style={{ height: '100%', width: '100%' }} opts={eOpts} notMerge /></div>
                        </Card>
                    )}

                    {/* location — location */}
                    {show('location') && (
                        <Card span="col-span-2 md:col-span-12" cls="px-5 pb-5 pt-[18px]">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 text-[#047857]" strokeWidth={2} /><CTitle t={L('Konum Analizi — İl / İlçe', 'Location Analysis — Province / District')} s={L('Haritadan ya da açılır listeden bir il seçin; ilçe kırılımı sağda açılır. Filtrelere duyarlı.', 'Pick a province from the map or the dropdown; districts open on the right. Filter-aware.')} /></div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <select aria-label={L('İl seç', 'Select province')} value={provName ?? ''} onChange={(e) => keepScroll(() => setProvName(e.target.value || null))} className={selCls}>
                                        {provNames.map((nm) => <option key={nm} value={nm}>{nm}</option>)}
                                    </select>
                                    <div className="flex gap-1 rounded-[8px] border border-[#e4e2dd] bg-[#f7f6f3] p-0.5">
                                        {([['count', L('İlan sayısı', 'Listings')], ['median', L('Medyan fiyat', 'Median price')]] as const).map(([m, lb]) => (
                                            <button type="button" key={m} onClick={() => keepScroll(() => setMapMetric(m))} className={`rounded-[6px] px-3 py-1.5 font-mono text-[11px] transition-colors ${mapMetric === m ? 'bg-[#047857] text-white' : 'text-[#5f5f5a] hover:bg-[#f1efe9]'}`}>{lb}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                                <div className="h-[440px] w-full min-w-0 overflow-hidden rounded-[10px] border border-[#ece9e3] bg-[#faf9f6]">
                                    <ReactECharts option={mapOpt} style={{ height: '100%', width: '100%' }} opts={eOpts} notMerge onEvents={{ click: onMapClick }} />
                                </div>
                                <div className="rounded-[10px] border border-[#ece9e3] bg-[#fdfcf9] p-4">
                                    <div className="flex items-baseline justify-between"><div className="text-[15px] font-bold text-[#1a1a1a]">{provName ?? '—'}</div>{provRow && <div className="font-mono text-[11px] text-[#86857e]">{nf(provRow.n)} {L('ilan', 'listings')}</div>}</div>
                                    {provRow && <div className="mt-0.5 font-mono text-[11px] text-[#047857]">{L('medyan', 'median')} {priceM(provRow.median)}</div>}
                                    <div className="mt-3 flex items-center justify-between border-b border-[#ece9e3] pb-1.5"><span className="font-mono text-[9.5px] uppercase tracking-[0.04em] text-[#86857e]">{L('İlçe', 'District')}</span><span className="font-mono text-[9.5px] uppercase tracking-[0.04em] text-[#86857e]">{L('İlan · medyan', 'Listings · median')}</span></div>
                                    <div className="mt-1 max-h-[356px] space-y-[3px] overflow-y-auto pr-1">
                                        {districts.length === 0 && <div className="py-6 text-center text-[12px] text-[#9a9a92]">{L('Bu seçimde ilçe verisi yok.', 'No district data for this selection.')}</div>}
                                        {districts.map((dd) => (
                                            <div key={dd.name} className="relative overflow-hidden rounded-[6px] px-2 py-[5px]">
                                                <div className="absolute inset-y-0 left-0 rounded-[6px] bg-[#e7f3ec]" style={{ width: `${Math.max(6, (dd.n / distMax) * 100)}%` }} />
                                                <div className="relative flex items-center justify-between gap-2"><span className="truncate text-[11.5px] font-medium text-[#1a1a1a]">{dd.name}</span><span className="shrink-0 font-mono text-[10.5px] tabular-nums text-[#5f5f5a]">{nf(dd.n)} · {priceShort(dd.median)}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            <p className="mt-6 font-mono text-[11px] leading-relaxed text-[#9a9a92]">
                {L(`ad_id başına son snapshot (${nf(meta.n_unique)} tekil ilan). Tüm grafikler ve harita filtrelere göre sunucuda (API) canlı hesaplanır; ham satırlar tarayıcıya gönderilmez. Konum, ilan adresinden ayrıştırıldı.`,
                    `Latest snapshot per ad_id (${nf(meta.n_unique)} unique listings). Every chart and the map are computed live server-side (API) from the filters — no raw rows are sent to the browser. Location parsed from listing address.`)}
            </p>
        </FinalShell>
    );
}
