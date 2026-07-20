"use client";

import { createContext, useContext, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { I18N_ENABLED } from './i18n-config';

export type Lang = 'en' | 'tr';

/** Base path of the localized site. English is served unprefixed at the root; Turkish under /tr. */
export const LOCALE_BASE = '';

/** Prefix an in-site href with the active locale. English stays unprefixed; Turkish gets /tr. */
export function localize(href: string, lang: Lang): string {
    if (lang !== 'tr') return href;
    if (href === '/' || href === '') return '/tr';
    return `/tr${href}`;
}

/** Read the active locale from a pathname (first segment). */
export function langFromPath(pathname: string): Lang {
    return pathname === '/tr' || pathname.startsWith('/tr/') ? 'tr' : 'en';
}

/** Swap the locale of a pathname while keeping the current sub-page. */
function withLang(pathname: string, lang: Lang): string {
    const bare = pathname === '/tr' ? '/' : pathname.startsWith('/tr/') ? pathname.slice(3) : pathname;
    if (lang === 'tr') return bare === '/' ? '/tr' : `/tr${bare}`;
    return bare || '/';
}

type Dict = Record<string, string>;

const en: Dict = {
    'nav.projects': 'Projects',
    'nav.work': 'Work',
    'nav.blog': 'Blog',
    'nav.dashboard': 'Dashboard',
    'nav.about': 'About',

    'hero.role': 'Data Scientist',
    'hero.name': 'Sadık Çoban.',
    'hero.tagline': 'I build intelligent data solutions, end to end.',
    'hero.h1a': 'Building Intelligent',
    'hero.h1b': 'Data Solutions',
    'hero.sub2': 'Data Scientist bridging the gap between Data Science and Production.',
    'hero.viewProjects': 'View Projects',
    'hero.intro': 'Bridging the gap between data science and production — models, pipelines, and the dashboards that make them useful.',
    'hero.cta': 'View Work',
    'hero.contact': 'Get in touch',
    'hero.available': 'Available for new projects',

    'tech.title': 'Technical Arsenal',
    'tech.sub': 'Technologies I work with',
    'tech.ml': 'Machine Learning & AI',
    'tech.data': 'Data Engineering & MLOps',
    'tech.frontend': 'Frontend & Visualization',
    'tech.devops': 'DevOps & Tools',

    'projects.title': 'Projects',
    'projects.subtitle': 'End-to-end systems where I explore AI, data science, and software engineering — from predictive models to production dashboards.',
    // Set in full ink: the two-tone split belongs to the homepage H1 alone, where the tonal
    // shift marks the turn in the sentence. Repeated here it read as a component slot.
    'projects.h1': 'One system, taken end to end: rigor that ships.',
    'projects.lede': 'A deployed ML system — scraping and deduplication, a leak-free evaluation, drift monitoring, and a serving API. The same discipline throughout: work out what the problem actually needs, then build only that.',
    'projects.more': 'More end-to-end projects are in progress — the code lives on GitHub in the meantime.',
    'journal.more': 'More engineering notes are on the way.',
    'projects.explore': 'Explore project',
    'projects.openDashboard': 'Open dashboard',
    'projects.viewEda': 'View EDA',

    'about.title': 'About',
    'about.lead': 'Data Scientist & MLOps Engineer focused on shipping models that survive production.',
    'about.p1': 'I work end to end: collecting and cleaning data, training models, and serving them behind APIs with monitoring for drift and explainability. My goal is always the same — turn messy, real-world data into decisions people can trust.',
    'about.doTitle': 'What I do',
    'about.do1': 'Machine learning models & evaluation',
    'about.do2': 'MLOps: serving, monitoring, drift detection',
    'about.do3': 'Data pipelines & feature engineering',
    'about.do4': 'Interactive dashboards & data viz',
    'about.cta': 'Get in touch',
    'about.eyebrow': 'About',
    'about.factBasedIn': 'Based in', 'about.factBasedInV': 'İstanbul · remote-friendly',
    'about.factFocus': 'Focus', 'about.factFocusV': 'ML engineering & MLOps',
    'about.factCurrent': 'Currently', 'about.factCurrentV': 'Open to new roles',
    'about.factLangs': 'Languages', 'about.factLangsV': 'Türkçe · English',
    'about.contactTitle': 'Get in touch',
    'about.contactLead': 'Open to roles, collaborations, and the occasional good problem. The fastest way to reach me is the form — or directly below.',
    'about.formName': 'Name', 'about.formNamePh': 'Your name',
    'about.formEmail': 'Email', 'about.formEmailPh': 'you@email.com',
    'about.formSubject': 'Subject',
    'about.subjJob': 'Job opportunity', 'about.subjCollab': 'Collaboration', 'about.subjConsult': 'Consulting', 'about.subjHi': 'Just saying hi',
    'about.formMessage': 'Message', 'about.formMessagePh': "A line or two about what you're working on…",
    'about.formNote': 'Opens your email app — replies within a day or two.',
    'about.formSend': 'Send message',

    'home.work.title': 'Selected Work',
    'home.work.viewAll': 'View all projects',
    'home.writing.title': 'Latest Writing',
    'home.writing.viewAll': 'View all posts',
    'home.contact.title': "Let's build something.",
    'home.contact.sub': 'Reach out.',
    'home.heroEyebrow': 'Data Scientist · MLOps Engineer',
    'home.heroH1Lead': 'Models that reach production, and',
    'home.heroH1Payoff': 'tell the truth.',
    'home.tryModel': 'Try the live model',
    // "versioned" was the one claim the repo contradicts — there is no model registry. Cut it,
    // and replaced the chiasmus with the thesis the rest of the page actually proves.
    'home.heroSub': 'I build the whole path — from the first notebook to a deployed, monitored API. Evaluated out-of-fold, so the number you see is the number you get.',
    'home.viewWork': 'View work',
    'home.getInTouch': 'Get in touch →',
    'home.figCaption': 'Used-car prices, 2005–2025',
    'home.sampleFigure': 'SAMPLE FIGURE',
    'home.metricsLabel': 'Selected metrics across recent work',
    'home.workLabel': 'Selected work',
    'home.arsenalLabel': 'Technical arsenal',
    'home.arsenalSub': 'Grouped by where it earns its place — not a wall of logos.',
    'home.writingLabel': 'Latest writing',
    'home.allPosts': 'All posts →',
    'home.live': 'LIVE DEMO',
    'home.case': 'CASE STUDY',
    'home.viewProject': 'View project',

    'blog.title': 'Writing',
    'blog.subtitle': 'Notes on data science, MLOps pipelines, and the systems behind them.',
    'blog.readArticle': 'Read article',
    'blog.empty': 'No posts yet.',
    'blog.catAll': 'All',
    'blog.featured': 'Featured',
    'blog.readPost': 'Read post',
    'blog.min': 'min read',
    'blog.allPosts': 'All posts',
    'blog.articles': '{n} articles',
    'blog.article': '{n} article',
    'blog.authorRole': 'Data Scientist · MLOps Engineer',

    'footer.tagline': 'Data Scientist & MLOps Engineer. Bridging complex data and real products.',
    'footer.nav': 'Navigation',
    'footer.connect': 'Connect',
    'footer.rights': 'All rights reserved.',
    'footer.home': 'Home',

    'dash.kicker': 'Car Price · MLOps',
    'dash.title': 'Market Overview',
    'flt.title': 'Filters',
    'flt.brand': 'Brand',
    'flt.series': 'Series',
    'flt.year': 'Year',
    'flt.price': 'Price',
    'flt.km': 'Mileage',
    'flt.apply': 'Apply',
    'flt.all': 'All',
    'flt.min': 'Min',
    'flt.max': 'Max',
    'dash.totalListings': 'Total Listings',
    'dash.avgPrice': 'Average Price',
    'dash.avg': 'avg',
    'dash.error': 'Could not reach the backend.',

    'eda.title': 'Exploratory Data Analysis',
    'eda.records': 'records',
    'eda.note': 'How the modelling table is distributed — price, mileage, brand and body type, plus the correlations and categorical effects that shaped the model.',
    'eda.meta': 'Pre-aggregated dataset · {n} records',

    'sb.overview': 'Overview',
    'sb.dashboard': 'Dashboard',
    'sb.eda': 'EDA',
    'sb.predict': 'Prediction',
    'sb.drift': 'Drift',
    'sb.shap': 'SHAP',
    'sb.report': 'Report',
    'sb.reportLab': 'Report · lab',
    'sb.textAnalysis': 'Text Analysis',
    'sb.journal': 'Journal',
    'sb.menu': 'Menu',
    'sb.close': 'Close',
    'sb.backPortfolio': 'Back to portfolio',

    // Project overview
    'ov.badge': 'The model, in one number',
    'ov.title1': 'Used BMW & Audi prices,',
    'ov.title2': 'predicted within 6.5%.',
    'ov.lead': 'A LightGBM model trained on 29,988 real Turkish listings, served behind a FastAPI backend on Railway. Every figure below is 5-fold out-of-fold — not a lucky holdout — and read from the same data the analysis reports.',
    'ov.tryPredict': 'Try range prediction',
    'ov.viewCode': 'View code on GitHub',
    'ov.m1': 'R² Accuracy',
    'ov.m2': 'Real-world data points',
    'ov.m3': 'Model confidence',
    'ov.featTitle': 'Production-grade MLOps',
    'ov.featDesc': 'A complete end-to-end pipeline. The CatBoost model is versioned on Hugging Face; inference runs on a high-performance FastAPI backend with drift monitoring and SHAP explainability.',
    'ov.f1': 'Custom web scraping pipeline',
    'ov.f2': 'MultiQuantile loss for interval prediction',
    'ov.f3': 'FastAPI for real-time inference',
    'ov.f4': 'Hugging Face model registry',
    'ov.f5': 'Interactive analysis dashboard',
    'ov.f6': 'SHAP values for explainability',
    'ov.readCase': 'Read engineering case',
    'ov.demoRange': 'Predicted price range',

    // Predict
    'pr.title': 'ML Price Estimator',
    'pr.kicker': 'Car Price · Prediction',
    'pr.desc': 'Estimate the true market value with ML support.',
    'pr.version': 'Model version',
    'pr.s1': 'Vehicle Identity',
    'pr.s2': 'Technical Specifications',
    'pr.s3': 'Damage & Body Condition',
    'pr.brand': 'Brand', 'pr.series': 'Series', 'pr.model': 'Model', 'pr.year': 'Year',
    'pr.mileage': 'Mileage (km)', 'pr.segment': 'Segment', 'pr.fuel': 'Fuel',
    'pr.transmission': 'Transmission', 'pr.body': 'Body type', 'pr.drivetrain': 'Drivetrain',
    'pr.power': 'Power (HP)', 'pr.engine': 'Engine (cc)', 'pr.warranty': 'Warranty status',
    'pr.manual': 'Manual', 'pr.selectList': 'Select list', 'pr.select': 'Select', 'pr.loading': 'Loading...',
    'pr.roof': 'Roof', 'pr.hood': 'Hood', 'pr.trunk': 'Trunk',
    'pr.doors': 'Door operations', 'pr.fenders': 'Fender operations',
    'pr.changed': 'Changed', 'pr.painted': 'Painted', 'pr.local': 'Local',
    'pr.heavy': 'Heavy damage record',
    'pr.calculate': 'Calculate value', 'pr.calculating': 'Calculating...',
    'pr.result': 'Estimated Market Value', 'pr.liras': 'Turkish Liras',
    'pr.min': 'Minimum', 'pr.max': 'Maximum', 'pr.damageScore': 'Damage Score',
    'pr.placeholder': 'Results will appear here',
    'pr.errVersion': 'Model version not loaded. Please refresh.',
    'pr.errFields': 'Please complete Brand, Series and Model.',
    'pr.errFail': 'Prediction failed. Check the service connection.',
    'pr.clean': 'Clean condition.', 'pr.moderate': 'Moderate damage.', 'pr.high': 'High damage risk.',

    // Drift
    'dr.title': 'Data Drift Analysis',
    'dr.kicker': 'Car Price · Drift',
    'dr.desc': 'Compare the listing-data distribution between two snapshot dates using statistical tests (KS + EMD).',
    'dr.ref': 'Reference snapshot (old)', 'dr.curr': 'Current snapshot (new)',
    'dr.compare': 'Compare', 'dr.analyzing': 'Analyzing...',
    'dr.drift': 'DRIFT', 'dr.stable': 'STABLE',
    'dr.stability': 'Stability score (EMD)', 'dr.oldData': 'Old (ref)', 'dr.newData': 'New (curr)',
    'dr.errSame': 'Select two different snapshots to compare.',
    'dr.errFail': 'Analysis failed. The snapshot may be empty or the server is unreachable.',
    'dr.errVersions': 'Could not fetch data snapshots. The backend may be down.',
    'dr.retry': 'Retry', 'dr.loadingVersions': 'Loading snapshots...',

    // SHAP
    'shap.title': 'SHAP Analysis',
    'shap.kicker': 'Car Price · SHAP',
    'shap.desc': 'See how the model makes price predictions and which features push the value up or down.',
    'shap.global': 'Global Feature Importance',
    'shap.summaryFor': 'Summary plot',
    'shap.notFound': 'Chart not found',
    'shap.notFoundDesc': 'No SHAP summary is available for this model.',
    'shap.analyzing': 'Analyzing chart...',
    'shap.howTitle': 'How to read this chart',
    'shap.how1': 'Horizontal axis: impact magnitude. Right increases price (+), left decreases (–).',
    'shap.how2': 'Red dots: a high value for that feature (e.g. high horsepower).',
    'shap.how3': 'Blue dots: a low value for that feature (e.g. low mileage).',
    'shap.examples': 'Example scenarios',
    'shap.exKm': 'Mileage (km)', 'shap.exKmDesc': 'Red dots (high km) cluster on the left — high mileage lowers the price.',
    'shap.exHp': 'Engine power (HP)', 'shap.exHpDesc': 'Red dots (high HP) sit on the right — a powerful engine raises the price.',
    'shap.exBrand': 'Brand & model', 'shap.exBrandDesc': 'Categorical, so dots are gray — read position, not color: right = premium, left = value-lowering.',

    // Report & Journal
    'rep.title': 'Analytics Report',
    'rep.kicker': 'Car Price · Report',
    // (nlp.title/nlp.kicker removed — the text-analysis page builds its own notebook
    //  shell like report-v2, so it no longer takes a FinalShell kicker/title.)
    'rep.desc': 'Full EDA & training notebook for the car-price pipeline.',
    'rn.tabNotebook': 'Notebook',
    'rn.tabNative': 'Native',
    'rn.intro': 'Dataset at a glance',
    'rn.introBody': 'The pipeline analyses {n} used-car listings scraped from the Turkish market. Below is the same exploratory analysis as the notebook, rendered natively with Plotly so every chart is interactive.',
    'rn.dist': 'How prices are distributed',
    'rn.distBody': 'Most listings cluster between ₺1M and ₺2M — a right-skewed distribution typical of used-car markets, with a long tail of premium vehicles above ₺4M.',
    'rn.year': 'Newer cars cost more',
    'rn.yearBody': 'Average price rises steadily with model year. The slope steepens after 2020, reflecting both newer technology and recent inflation in the market.',
    'rn.brand': 'Brand landscape',
    'rn.brandBody': 'A handful of brands dominate the listing volume. This imbalance matters for modelling — rare brands carry less signal and wider prediction intervals.',
    'rn.km': 'Mileage pulls prices down',
    'rn.kmBody': 'The scatter shows a clear negative relationship between mileage and price. The spread widens at low mileage, where brand and trim drive most of the variance.',
    'rn.body': 'Body type premium',
    'rn.bodyBody': 'Coupés and cabrios command the highest medians, while hatchbacks sit lowest. Body type is a strong categorical signal for the model.',
    'rn.corr': 'What drives price',
    'rn.corrBody': 'Year correlates most positively with price (r ≈ 0.77) and mileage most negatively (r ≈ −0.63). Engine size adds little on its own — power captures most of it.',
    'rn.damage': 'The cost of heavy damage',
    'rn.damageBody': 'Heavy-damaged cars sell for noticeably less on average. The model learns this penalty and reflects it in the damage-risk score.',
    'rn.model': 'Modelling',
    'rn.modelBody': 'A CatBoost MultiQuantile model (0.05 / 0.5 / 0.95) predicts a price interval rather than a single value. Latest version reaches R² ≈ 0.976 with 84.6% interval coverage on the test set.',
    'jr.title': 'Project Journal',
    'jr.kicker': 'Car Price · Journal',
    'jr.desc': 'Development notes, technical challenges and case studies for the Car Price project.',

    'chart.priceByYear': 'Price by Year',
    'chart.priceByYear.s': 'average · 2005–2025',
    'chart.fuel': 'Fuel Distribution',
    'chart.fuel.s': 'market share',
    'chart.brandRange': 'Price Range by Brand',
    'chart.brandRange.s': 'low · median · high',
    'chart.scatter': 'Mileage vs Price',
    'chart.scatter.s': 'sampled market depth',
    'chart.density': 'Price × Mileage Density',
    'chart.density.s': 'listing count per cell',
    'chart.damage': 'Damage Heatmap',
    'chart.damage.s': 'frequency by body part (top view)',

    'eda.priceDist': 'Price Distribution',
    'eda.priceDist.s': '₺M buckets',
    'eda.priceYear': 'Average Price by Year',
    'eda.priceYear.s': '₺M',
    'eda.brand': 'Listings by Brand',
    'eda.brand.s': 'count',
    'eda.fuel': 'Fuel Type',
    'eda.fuel.s': 'distribution',
    'eda.scatter': 'Mileage vs Price',
    'eda.scatter.s': '2.5k sample',
    'eda.body': 'Price by Body Type',
    'eda.body.s': 'box · ₺M',
    'eda.corr': 'Feature Correlation',
    'eda.corr.s': 'Pearson r',
    'eda.damage': 'Heavy Damage Impact',
    'eda.damage.s': 'average ₺M',
};

const tr: Dict = {
    'nav.projects': 'Projeler',
    'nav.work': 'Çalışmalar',
    'nav.blog': 'Blog',
    'nav.dashboard': 'Panel',
    'nav.about': 'Hakkımda',

    'hero.role': 'Veri Bilimci',
    'hero.name': 'Sadık Çoban.',
    'hero.tagline': 'Uçtan uca akıllı veri çözümleri geliştiriyorum.',
    'hero.h1a': 'Akıllı',
    'hero.h1b': 'Veri Çözümleri',
    'hero.sub2': 'Veri bilimi ile üretim arasındaki köprüyü kuran bir veri bilimci.',
    'hero.viewProjects': 'Projeleri Gör',
    'hero.intro': 'Veri bilimi ile üretim arasındaki köprüyü kuruyorum: modeller, veri hatları ve onları işe yarar kılan panolar.',
    'hero.cta': 'Projeleri Gör',
    'hero.contact': 'İletişime geç',
    'hero.available': 'Yeni projelere açık',

    'tech.title': 'Teknik Cephanelik',
    'tech.sub': 'Kullandığım teknolojiler',
    'tech.ml': 'Makine Öğrenmesi & Yapay Zekâ',
    'tech.data': 'Veri Mühendisliği & MLOps',
    'tech.frontend': 'Önyüz & Görselleştirme',
    'tech.devops': 'DevOps & Araçlar',

    'projects.title': 'Projeler',
    'projects.subtitle': 'Yapay zekâ, veri bilimi ve yazılım mühendisliğini bir araya getirdiğim uçtan uca sistemler; tahmin modellerinden üretim panolarına kadar uzanıyor.',
    'projects.h1': 'Uçtan uca kurulmuş tek bir sistem: sahaya çıkan titizlik.',
    'projects.lede': 'Üretime çıkmış bir ML sistemi — veri toplama ve tekilleştirme, sızıntısız değerlendirme, drift izleme ve servis API’si. Baştan sona aynı disiplin: problemin gerçekten neye ihtiyacı olduğunu belirle, sadece onu kur.',
    'projects.more': 'Daha fazla uçtan uca proje yolda — bu sırada kodun tamamı GitHub’da.',
    'journal.more': 'Daha fazla mühendislik notu yolda.',
    'projects.explore': 'Projeyi incele',
    'projects.openDashboard': 'Paneli aç',
    'projects.viewEda': 'EDA’yı gör',

    'about.title': 'Hakkımda',
    'about.lead': 'Üretim ortamında ayakta kalabilen modeller geliştirmeye odaklanan bir Veri Bilimci & MLOps Mühendisi.',
    'about.p1': 'Uçtan uca çalışırım: veriyi toplar ve temizlerim, model eğitirim, ardından drift izleme ve açıklanabilirlikle birlikte bir API arkasında sunarım. Amacım hep aynı: dağınık gerçek dünya verisini insanların güvenebileceği kararlara dönüştürmek.',
    'about.doTitle': 'Ne yapıyorum',
    'about.do1': 'Makine öğrenmesi modelleri & değerlendirme',
    'about.do2': 'MLOps: servis etme, izleme, drift tespiti',
    'about.do3': 'Veri hatları & öznitelik mühendisliği',
    'about.do4': 'Etkileşimli panolar & veri görselleştirme',
    'about.cta': 'İletişime geç',
    'about.eyebrow': 'Hakkımda',
    'about.factBasedIn': 'Konum', 'about.factBasedInV': 'İstanbul · uzaktan çalışmaya açık',
    'about.factFocus': 'Odak', 'about.factFocusV': 'ML mühendisliği & MLOps',
    'about.factCurrent': 'Durum', 'about.factCurrentV': 'Yeni rollere açık',
    'about.factLangs': 'Diller', 'about.factLangsV': 'Türkçe · İngilizce',
    'about.contactTitle': 'İletişime geç',
    'about.contactLead': 'Yeni rollere, iş birliklerine ve arada bir denk gelen güzel problemlere açığım. Bana ulaşmanın en hızlı yolu formu doldurmak; istersen hemen aşağıdaki kanalları da kullanabilirsin.',
    'about.formName': 'Ad', 'about.formNamePh': 'Adınız',
    'about.formEmail': 'E-posta', 'about.formEmailPh': 'ornek@eposta.com',
    'about.formSubject': 'Konu',
    'about.subjJob': 'İş fırsatı', 'about.subjCollab': 'İş birliği', 'about.subjConsult': 'Danışmanlık', 'about.subjHi': 'Sadece merhaba',
    'about.formMessage': 'Mesaj', 'about.formMessagePh': 'Üzerinde çalıştığın şey hakkında bir iki satır…',
    'about.formNote': 'E-posta uygulamanı açar — bir iki gün içinde yanıtlarım.',
    'about.formSend': 'Mesaj gönder',

    'home.work.title': 'Seçili Çalışmalar',
    'home.work.viewAll': 'Tüm projeler',
    'home.writing.title': 'Son Yazılar',
    'home.writing.viewAll': 'Tüm yazılar',
    'home.contact.title': 'Birlikte bir şey üretelim.',
    'home.contact.sub': 'İletişime geç.',
    'home.heroEyebrow': 'Veri Bilimci · MLOps Mühendisi',
    'home.heroH1Lead': 'Üretime çıkan ve',
    'home.heroH1Payoff': 'doğruyu söyleyen modeller.',
    'home.tryModel': 'Canlı modeli dene',
    'home.heroSub': 'Yolun tamamını kuruyorum — ilk defterden dağıtılmış, izlenen bir API’ye. Out-of-fold değerlendirildi; gördüğün sayı, alacağın sayı.',
    'home.viewWork': 'Çalışmaları gör',
    'home.getInTouch': 'İletişime geç →',
    'home.figCaption': 'İkinci el araç fiyatları, 2005–2025',
    'home.sampleFigure': 'ÖRNEK GRAFİK',
    'home.metricsLabel': 'Son çalışmalardan seçili metrikler',
    'home.workLabel': 'Seçili çalışmalar',
    'home.arsenalLabel': 'Teknik cephanelik',
    'home.arsenalSub': 'Her araç, yerini hak ettiği alana göre gruplandı — logo duvarı değil.',
    'home.writingLabel': 'Son yazılar',
    'home.allPosts': 'Tüm yazılar →',
    'home.live': 'CANLI DEMO',
    'home.case': 'VAKA ÇALIŞMASI',
    'home.viewProject': 'Projeyi gör',

    'blog.title': 'Yazılar',
    'blog.subtitle': 'Veri bilimi, MLOps iş akışları ve arkalarındaki sistemler üzerine notlar.',
    'blog.readArticle': 'Yazıyı oku',
    'blog.empty': 'Henüz yazı yok.',
    'blog.catAll': 'Tümü',
    'blog.featured': 'Öne çıkan',
    'blog.readPost': 'Yazıyı oku',
    'blog.min': 'dk okuma',
    'blog.allPosts': 'Tüm yazılar',
    'blog.articles': '{n} yazı',
    'blog.article': '{n} yazı',
    'blog.authorRole': 'Veri Bilimci · MLOps Mühendisi',

    'footer.tagline': 'Veri Bilimci & MLOps Mühendisi. Karmaşık veriyi gerçek ürünlere dönüştürüyorum.',
    'footer.nav': 'Gezinme',
    'footer.connect': 'İletişim',
    'footer.rights': 'Tüm hakları saklıdır.',
    'footer.home': 'Ana sayfa',

    'dash.kicker': 'Araç Fiyatı · MLOps',
    'dash.title': 'Pazara Genel Bakış',
    'flt.title': 'Filtreler',
    'flt.brand': 'Marka',
    'flt.series': 'Seri',
    'flt.year': 'Yıl',
    'flt.price': 'Fiyat',
    'flt.km': 'Kilometre',
    'flt.apply': 'Uygula',
    'flt.all': 'Tümü',
    'flt.min': 'Min',
    'flt.max': 'Maks',
    'dash.totalListings': 'Toplam İlan',
    'dash.avgPrice': 'Ortalama Fiyat',
    'dash.avg': 'ort.',
    'dash.error': 'Sunucuya ulaşılamadı.',

    'eda.title': 'Keşifsel Veri Analizi',
    'eda.records': 'kayıt',
    'eda.note': 'Modelleme tablosunun dağılımı — fiyat, kilometre, marka ve kasa tipi; ayrıca modeli şekillendiren korelasyonlar ve kategorik etkiler.',
    'eda.meta': 'Önceden işlenmiş veri · {n} kayıt',

    'sb.overview': 'Genel Bakış',
    'sb.dashboard': 'Panel',
    'sb.eda': 'EDA',
    'sb.predict': 'Tahmin',
    'sb.drift': 'Drift',
    'sb.shap': 'SHAP',
    'sb.report': 'Rapor',
    'sb.reportLab': 'Rapor · lab',
    'sb.textAnalysis': 'Metin Analizi',
    'sb.journal': 'Günlük',
    'sb.menu': 'Menü',
    'sb.close': 'Kapat',
    'sb.backPortfolio': 'Portfolyoya dön',

    // Project overview
    'ov.badge': 'Tek bir sayıda model',
    'ov.title1': 'İkinci el BMW & Audi fiyatları,',
    'ov.title2': '%6.5 hata payıyla.',
    'ov.lead': '29.988 gerçek Türkiye ilanıyla eğitilmiş bir LightGBM modeli, Railway üzerinde FastAPI arka ucunun arkasında servis ediliyor. Aşağıdaki her rakam 5-fold out-of-fold — şanslı bir holdout değil — ve analizin okuduğu veriden geliyor.',
    'ov.tryPredict': 'Aralık tahminini dene',
    'ov.viewCode': 'Kodu GitHub’da gör',
    'ov.m1': 'R² Doğruluk',
    'ov.m2': 'Gerçek veri noktası',
    'ov.m3': 'Model güveni',
    'ov.featTitle': 'Üretim düzeyinde MLOps',
    'ov.featDesc': 'Uçtan uca, eksiksiz bir ML iş akışı. CatBoost modeli Hugging Face üzerinde sürümlenir; çıkarım ise drift izleme ve SHAP açıklanabilirliğiyle birlikte yüksek performanslı bir FastAPI arka ucunda çalışır.',
    'ov.f1': 'Özel web kazıma hattı',
    'ov.f2': 'Aralık tahmini için MultiQuantile kayıp fonksiyonu',
    'ov.f3': 'Gerçek zamanlı çıkarım için FastAPI',
    'ov.f4': 'Hugging Face model kayıt defteri',
    'ov.f5': 'Etkileşimli analiz panosu',
    'ov.f6': 'Açıklanabilirlik için SHAP değerleri',
    'ov.readCase': 'Mühendislik vakasını oku',
    'ov.demoRange': 'Tahmini fiyat aralığı',

    // Predict
    'pr.title': 'ML Fiyat Tahmin Aracı',
    'pr.kicker': 'Araç Fiyatı · Tahmin',
    'pr.desc': 'ML desteğiyle gerçek piyasa değerini tahmin et.',
    'pr.version': 'Model sürümü',
    'pr.s1': 'Araç Kimliği',
    'pr.s2': 'Teknik Özellikler',
    'pr.s3': 'Hasar & Kaporta Durumu',
    'pr.brand': 'Marka', 'pr.series': 'Seri', 'pr.model': 'Model', 'pr.year': 'Yıl',
    'pr.mileage': 'Kilometre (km)', 'pr.segment': 'Segment', 'pr.fuel': 'Yakıt',
    'pr.transmission': 'Vites', 'pr.body': 'Kasa tipi', 'pr.drivetrain': 'Çekiş',
    'pr.power': 'Güç (HP)', 'pr.engine': 'Motor (cc)', 'pr.warranty': 'Garanti durumu',
    'pr.manual': 'Elle gir', 'pr.selectList': 'Listeden seç', 'pr.select': 'Seç', 'pr.loading': 'Yükleniyor...',
    'pr.roof': 'Tavan', 'pr.hood': 'Kaput', 'pr.trunk': 'Bagaj',
    'pr.doors': 'Kapı işlemleri', 'pr.fenders': 'Çamurluk işlemleri',
    'pr.changed': 'Değişen', 'pr.painted': 'Boyalı', 'pr.local': 'Lokal',
    'pr.heavy': 'Ağır hasar kaydı',
    'pr.calculate': 'Değeri hesapla', 'pr.calculating': 'Hesaplanıyor...',
    'pr.result': 'Tahmini Piyasa Değeri', 'pr.liras': 'Türk Lirası',
    'pr.min': 'Minimum', 'pr.max': 'Maksimum', 'pr.damageScore': 'Hasar Skoru',
    'pr.placeholder': 'Sonuçlar burada görünecek',
    'pr.errVersion': 'Model sürümü yüklenmedi. Lütfen sayfayı yenileyin.',
    'pr.errFields': 'Lütfen Marka, Seri ve Model seçin.',
    'pr.errFail': 'Tahmin başarısız oldu. Servis bağlantısını kontrol edin.',
    'pr.clean': 'Temiz durum.', 'pr.moderate': 'Orta hasar.', 'pr.high': 'Yüksek hasar riski.',

    // Drift
    'dr.title': 'Veri Drift Analizi',
    'dr.kicker': 'Araç Fiyatı · Drift',
    'dr.desc': 'İki snapshot tarihi arasındaki ilan verisi dağılımını istatistiksel testlerle (KS + EMD) karşılaştır.',
    'dr.ref': 'Referans snapshot (eski)', 'dr.curr': 'Güncel snapshot (yeni)',
    'dr.compare': 'Karşılaştır', 'dr.analyzing': 'Analiz ediliyor...',
    'dr.drift': 'DRIFT', 'dr.stable': 'KARARLI',
    'dr.stability': 'Kararlılık skoru (EMD)', 'dr.oldData': 'Eski (ref)', 'dr.newData': 'Yeni (güncel)',
    'dr.errSame': 'Karşılaştırmak için iki farklı snapshot seçin.',
    'dr.errFail': 'Analiz başarısız oldu. Snapshot boş olabilir ya da sunucuya ulaşılamıyor.',
    'dr.errVersions': 'Veri snapshot’ları alınamadı. Sunucu kapalı olabilir.',
    'dr.retry': 'Tekrar dene', 'dr.loadingVersions': 'Snapshot’lar yükleniyor...',

    // SHAP
    'shap.title': 'SHAP Analizi',
    'shap.kicker': 'Araç Fiyatı · SHAP',
    'shap.desc': 'Modelin fiyatı nasıl tahmin ettiğini ve hangi özelliklerin değeri artırıp azalttığını gör.',
    'shap.global': 'Genel Özellik Önemi',
    'shap.summaryFor': 'Özet grafiği',
    'shap.notFound': 'Grafik bulunamadı',
    'shap.notFoundDesc': 'Bu model için SHAP özeti bulunamadı.',
    'shap.analyzing': 'Grafik hazırlanıyor...',
    'shap.howTitle': 'Bu grafik nasıl okunur',
    'shap.how1': 'Yatay eksen: etki büyüklüğü. Sağ tarafta fiyat artar (+), solda azalır (–).',
    'shap.how2': 'Kırmızı noktalar: o özellikte yüksek değer (örn. yüksek beygir gücü).',
    'shap.how3': 'Mavi noktalar: o özellikte düşük değer (örn. düşük kilometre).',
    'shap.examples': 'Örnek senaryolar',
    'shap.exKm': 'Kilometre (km)', 'shap.exKmDesc': 'Kırmızı noktalar (yüksek km) solda toplanıyor; yani yüksek kilometre fiyatı düşürüyor.',
    'shap.exHp': 'Motor gücü (HP)', 'shap.exHpDesc': 'Kırmızı noktalar (yüksek HP) sağda yer alıyor; güçlü motor fiyatı yükseltiyor.',
    'shap.exBrand': 'Marka & model', 'shap.exBrandDesc': 'Kategorik olduğu için noktalar gri; rengine değil konumuna bak: sağ = premium, sol = değeri düşüren.',

    // Report & Journal
    'rep.title': 'Analitik Rapor',
    'rep.kicker': 'Araç Fiyatı · Rapor',
    'rep.desc': 'Araç fiyatı tahmin hattı için kapsamlı EDA ve model eğitimi defteri.',
    'rn.tabNotebook': 'Defter',
    'rn.tabNative': 'Yerel',
    'rn.intro': 'Veri setine bakış',
    'rn.introBody': 'Bu analiz, Türkiye pazarından derlenen {n} ikinci el araç ilanını kapsıyor. Aşağıda defterdeki keşifsel analizin aynısını görüyorsun; her grafik, etkileşimli olacak şekilde doğrudan Plotly ile çiziliyor.',
    'rn.dist': 'Fiyatlar nasıl dağılıyor',
    'rn.distBody': 'İlanların çoğu ₺1M–₺2M arasında yoğunlaşıyor. Bu, ikinci el pazarına özgü, sağa çarpık bir dağılım; ₺4M üstü premium araçlar ise uzun bir kuyruk oluşturuyor.',
    'rn.year': 'Yeni araçlar daha pahalı',
    'rn.yearBody': 'Ortalama fiyat, model yılı yükseldikçe istikrarlı biçimde artıyor. 2020 sonrasında eğim dikleşiyor; bunda hem yeni teknolojinin hem de son dönem enflasyonun payı var.',
    'rn.brand': 'Marka dağılımı',
    'rn.brandBody': 'İlan hacmine birkaç marka hâkim. Bu dengesizlik modelleme açısından önemli; çünkü nadir markalar daha az sinyal taşır ve daha geniş tahmin aralıklarına yol açar.',
    'rn.km': 'Kilometre fiyatı düşürür',
    'rn.kmBody': 'Saçılım grafiği, kilometre ile fiyat arasında net bir negatif ilişki gösteriyor. Kilometre düştükçe yayılım artıyor; bu bölgede varyansın çoğunu marka ve donanım belirliyor.',
    'rn.body': 'Kasa tipi primi',
    'rn.bodyBody': 'En yüksek medyan fiyat coupe ve cabriolarda, en düşük ise hatchbacklerde görülüyor. Kasa tipi, model için güçlü bir kategorik sinyaldir.',
    'rn.corr': 'Fiyatı ne belirliyor',
    'rn.corrBody': 'Fiyatla en güçlü pozitif korelasyonu yıl gösterir (r ≈ 0,77); en güçlü negatif korelasyonu ise kilometre (r ≈ −0,63). Motor hacmi tek başına az katkı sağlar; çünkü bu bilgiyi güç (HP) değişkeni zaten içerir.',
    'rn.damage': 'Ağır hasarın bedeli',
    'rn.damageBody': 'Ağır hasarlı araçlar ortalamada belirgin biçimde daha ucuza satılıyor. Model bu cezayı öğreniyor ve hasar-risk skoruna yansıtıyor.',
    'rn.model': 'Modelleme',
    'rn.modelBody': 'CatBoost MultiQuantile modeli (0,05 / 0,5 / 0,95) tek bir değer yerine bir fiyat aralığı tahmin eder. Son sürüm, test setinde R² ≈ 0,976 ve %84,6 aralık kapsamına ulaşır.',
    'jr.title': 'Proje Günlüğü',
    'jr.kicker': 'Araç Fiyatı · Günlük',
    'jr.desc': 'Araç Fiyatı projesi için geliştirme notları, teknik zorluklar ve vaka çalışmaları.',

    'chart.priceByYear': 'Yıla Göre Fiyat',
    'chart.priceByYear.s': 'ortalama · 2005–2025',
    'chart.fuel': 'Yakıt Dağılımı',
    'chart.fuel.s': 'pazar payı',
    'chart.brandRange': 'Markaya Göre Fiyat Aralığı',
    'chart.brandRange.s': 'alt · medyan · üst',
    'chart.scatter': 'Kilometre – Fiyat',
    'chart.scatter.s': 'örneklenmiş pazar',
    'chart.density': 'Fiyat × Kilometre Yoğunluğu',
    'chart.density.s': 'hücre başına ilan sayısı',
    'chart.damage': 'Hasar Isı Haritası',
    'chart.damage.s': 'parçaya göre sıklık (üstten görünüm)',

    'eda.priceDist': 'Fiyat Dağılımı',
    'eda.priceDist.s': '₺M aralıkları',
    'eda.priceYear': 'Yıla Göre Ortalama Fiyat',
    'eda.priceYear.s': '₺M',
    'eda.brand': 'Markaya Göre İlan',
    'eda.brand.s': 'adet',
    'eda.fuel': 'Yakıt Türü',
    'eda.fuel.s': 'dağılım',
    'eda.scatter': 'Kilometre – Fiyat',
    'eda.scatter.s': '2.5k örnek',
    'eda.body': 'Kasa Tipine Göre Fiyat',
    'eda.body.s': 'kutu · ₺M',
    'eda.corr': 'Özellik Korelasyonu',
    'eda.corr.s': 'Pearson r',
    'eda.damage': 'Ağır Hasar Etkisi',
    'eda.damage.s': 'ortalama ₺M',
};

const DICTS: Record<Lang, Dict> = { en, tr };

interface Ctx {
    lang: Lang;
    t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ initialLang = 'en', children }: { initialLang?: Lang; children: React.ReactNode }) {
    // Locale is URL-driven: the server seeds it from the route segment, so SSR and the
    // first client paint already agree — no localStorage read, no language flash on reload.
    const [lang] = useState<Lang>(initialLang);

    const t = useCallback((key: string, vars?: Record<string, string | number>) => {
        let s = DICTS[lang][key] ?? DICTS.en[key] ?? key;
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
        return s;
    }, [lang]);

    return <LanguageContext.Provider value={{ lang, t }}>{children}</LanguageContext.Provider>;
}

export function useLang() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLang must be used within LanguageProvider');
    return ctx;
}

export function LangSwitch({ className }: { className?: string }) {
    const { lang } = useLang();
    const pathname = usePathname() || LOCALE_BASE;
    if (!I18N_ENABLED) return null; // Turkish deactivated → hide the EN/TR switch.
    return (
        <div className={`inline-flex items-center rounded-full border border-[#e4e2dd] overflow-hidden text-xs font-medium ${className || ''}`}>
            {(['en', 'tr'] as Lang[]).map((l) => (
                <Link
                    key={l}
                    href={withLang(pathname, l)}
                    hrefLang={l}
                    className={`px-2.5 py-1 transition-colors ${lang === l
                        ? 'bg-[#047857] text-white'
                        : 'text-[#5f5f5a] hover:text-[#1a1a1a]'}`}
                    aria-current={lang === l ? 'true' : undefined}
                >
                    {l.toUpperCase()}
                </Link>
            ))}
        </div>
    );
}
