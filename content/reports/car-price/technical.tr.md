# İkinci El Araç Piyasası Analizi — Teknik Rapor

Bu rapor iki soruya yanıt arar: İkinci el araç fiyatını ne belirler ve model bunu ne kadar isabetle öngörebilir? Analiz; **29.988** TR plakalı BMW/Audi ilanında veri temizliği ve sızıntı kontrolünden geçerek kontrollü fiyat etkileri, piyasa yapısı, model karşılaştırması ve zamansal testleri ortaya koyar. LightGBM ortalama **%6.5** yüzde hatayla (MAE: **₺110K**, R²: **0.9744**) çalışarak aynı model ve yılın medyanına göre **%42** daha iyi sonuç verir. Paylaşılan tüm metrikler, modelin daha önce görmediği veriler üzerinden **5-fold out-of-fold** kurgusuyla hesaplanmıştır.

## 1. Veri temizleme ve sızıntı tespiti

**Toplam 45.159 tarama kaydı → 29.988 ilan.** Aradaki 15.171 satır aynı ilanın tekrar taranması — veri değil, tarama artığı. `ad_id` başına en son kayıt alındı.

Medyan ilan fiyatı ₺1.54M, ₺0.84M–₺3.42M arası (P10–P90).

**Kapsam: yalnız TR plakalı araçlar.** Çalışmaya yabancı/mavi plakalı ve plaka bilgisi olmayan ilanlar dahil edilmemiştir. Vergilendirme rejimindeki farklılıklar modeli ve analizi yanıltabileceğinden kapsam dışı bırakılmıştır.

### Ölçek

| kalem | değer |
|---|---:|
| ham satır (tüm taramalar) | 45.159 |
| tekil ilan (`ad_id` dedup) | 29.988 |
| tarama dönemi | 4 (2026-01-18 – 2026-06-27) |
| modele giren öznitelik | 25 |
| BMW / Audi | 17.896 / 12.092 |
| hedef | `log1p(price)` |

### Üç veri katmanı

1. **Yapısal** — yaş · km · motor gücü/hacmi · kasa · yakıt · vites · çekiş · segment.
2. **Hasar / ekspertiz** — her kaporta paneli × {değişen, boyalı, lokal boya} + tramer + ağır hasar.
3. **Serbest metin** — satıcı açıklaması; modelde **kullanılmıyor**. Ölçüldü, katkı çıkmadı; ayrıntısı §10'da.

### Tutulan öznitelikler (25)

Model (`model`) · Seri (`series`) · Marka (`brand`) · Kasa Tipi (`kb_body_type`) · Çekiş (`kb_drivetrain`) · Segment (`segment`) · Vites Tipi (`kb_transmission`) · Yakıt Tipi (`kb_fuel`) · Tavan Durumu (`roof_state`) · Kaput Durumu (`hood_state`) · Bagaj Durumu (`trunk_state`) · Yaş (yıl) (`vehicle_age`) · Kilometre (`gb_mileage`) · Motor Gücü (hp) (`power_hp_val`) · Motor Hacmi (cc) (`engine_cc_val`) · Kapı Değişen (`door_changed`) · Kapı Boyalı (`door_painted`) · Kapı Lokal Boya (`door_local`) · Çamurluk Değişen (`fender_changed`) · Çamurluk Boyalı (`fender_painted`) · Çamurluk Lokal Boya (`fender_local`) · Tampon Değişen (`bumper_changed`) · Tampon Boyalı (`bumper_painted`) · Tampon Lokal Boya (`bumper_local`) · Ağır Hasarlı (`is_heavy_damaged`)

### Atılan öznitelik grupları

| grup | gerekçe | ~kolon |
|---|---|---:|
| A | Sabit varyans | ~2 |
| B | Gereksiz kb/gb | ~12 |
| B* | Kapsam farkı | 1 |
| C | Kimlik/sızıntı | ~8 |
| D | Blok-eksik>%40 | ~15 |
| E | Spec-eksik~%26 | ~10 |

Eksik değerler seri > segment > marka medyan hiyerarşisiyle doldurulmuş; %27.6 eksik olan `torque_nm` değişkeni ise analiz dışı bırakılmıştır.

**Sızıntı kontrolü.** Dedup (ilanların tekilleştirilmesi) `ad_id` üzerinden ve CV'den ÖNCE yapıldı. Değerlendirme 5-fold out-of-fold: her ilan tam olarak bir kez, kendisini görmemiş bir modelle tahmin edildi.

### İçerik bazlı tekrar

| tanım | fazla satır | pay |
|---|---:|---:|
| katı — tüm ayırt edici alanlar aynı | 137 | %0.46 |
| gevşek | 209 | %0.70 |

`ad_id`'nin göremediği risk: `ad_id` farklı ama ilan aynı. 127 tekrar grubu. Katı tanımın kolonları: `price`, `gb_mileage`, `gb_year`, `brand`, `series`, `model`, `kb_fuel`, `is_heavy_damaged`, `count_painted`, `count_changed`, `power_hp_up`, `engine_cc_up`. Bir kısmı gerçek tekrar ilan, bir kısmı yaygın modellerde tesadüfi çakışma; her iki durumda da fold'lar arası sızabilecek pay %1'in altında.

En çok tekrar eden ilanlar:

| model | yıl | fiyat | tekrar |
|---|---:|---:|---:|
| 320i Sport Line | 2025 | ₺4.900.000 | 4 |
| 318i Standart | 2005 | ₺717.000 | 3 |
| A3 Sportback 1.6 Ambition | 2010 | ₺890.000 | 3 |
| 116d Joy Plus | 2015 | ₺1.044.950 | 3 |
| 320i First Edition Sport Line | 2019 | ₺2.530.000 | 3 |

## 2. Eksiklik rastgele değil

30 kolon %2'nin üzerinde eksik ve bir kısmı **birlikte** düşüyor. Bu "eksik veri" değil, katalog eşleşmesinin çöktüğü ilanlar: standart modeller eşleşir, niş varyantlar eşleşmez, tüm özellik listesi birden boşalır. Sistematik olduğu için güvenilir imputasyon yok → bu kolonlar çıkarıldı.

![Eksiklik oranı (%) — aynı oran = birlikte eksik blok](figures/tr-16-missing.png)

### Birlikte eksik bloklar

| kolon | ort. eksik | birlikte eksik | örnek kolonlar |
|---:|---:|---:|---|
| 15 | %27.6 | %98.8 | `weight_kg`, `kb_fuel_tank`, `gb_segment`, `torque_nm` … |
| 2 | %31.4 | %100.0 | `city_fuel_cons`, `highway_fuel_cons` |
| 2 | %29.9 | %100.0 | `production_year_start`, `production_year_end` |
| 2 | %29.3 | %100.0 | `rpm_max`, `rpm_min` |

**Eksiklik korelasyonu 1.0 ≠ değer korelasyonu (~0.59).** Birlikte hareket eden, kolonların *var/yok* durumu; değerleri ayrı bilgi taşır. Ortak olan yalnız kaynak: katalog eşleşmesi.

### gb_ / kb_ çift kaynak

| alan | Genel Bakış (gb) boş | KısaBilgi (kb) ikizi |
|---|---:|---|
| Çekiş (`gb_drivetrain`) | %74.0 | `kb_drivetrain` · eksik %1.5 |
| Ort. Trafik Sigortası (`gb_traffic_insurance_avg`) | %54.3 | yok |
| Ortalama Kasko (`gb_kasko_avg`) | %51.1 | yok |
| Yıllık MTV (`gb_mtv_yearly`) | %40.6 | yok |

İlan sayfasında aynı bilgi iki farklı sekmede de yer alabiliyor. Modelde tekrar olmasın diye çakışan bilgide verisi daha dolu olan tarafı (`kb`) seçtik. Karşılığı olmayan ve %40'tan fazlası boş olan 3 alanı (sigorta ve vergi) ise eledik.

**kb/gb nedir.** `kb` kısa bilgi, `gb` ise genel bakış sekmesidir. İkisi de benzer şeyleri yazar. Bilgiyi modele iki kez sokmamak için tek bir sütuna indirdik; iki tarafı birbiriyle yamamak yerine en dolu olanı tutup diğerini sildik.

## 3. Fazlalık, bağıntı ve marka

Cramér's V ilişkinin gücünü (simetrik), Theil's U yönünü (asimetrik) verir. Asimetri bulgunun kendisi: `model` diğerlerini neredeyse tam belirliyor ama tersi değil — yani `seri`, `model`in kabalaştırılmış hâli, bağımsız bilgi değil.

![Theil's U (yönlü bağımlılık)](figures/tr-17-theils-u.png)

![Cramér's V (simetrik ilişki gücü)](figures/tr-18-cramers-v.png)

![Her seri tek bir segmente düşüyor — medyan fiyat (₺M)](figures/tr-19-series-segment.png)

### Theil's U asimetrisi

| yön | okunuşu | U |
|---|---|---:|
| U(seri \| model) | model bilinince seri ne kadar belli | 0.999 |
| U(model \| seri) | seri bilinince model ne kadar belli | 0.387 |
| U(marka \| model) | model bilinince marka | 1.000 |
| U(marka \| seri) | seri bilinince marka | 1.000 |

Model seriyi 1.00 belirliyor, seri modeli yalnız 0.39. Marka hem modelden hem seriden tamamen okunuyor → marka ayrı bilgi taşımaz (aşağıdaki marka ablasyonu aynı sonucu ölçer).

Sayısal öznitelikler arası korelasyon — yukarıdaki kategorik bağıntının sayısal karşılığı. |r|>0.5 çiftler çoklu-bağlantı için işaretlendi (VIF ile de kontrol edildi, §6).

![Pearson](figures/tr-20-pearson.png)

![Spearman](figures/tr-21-spearman.png)

### Yüksek korelasyon çiftleri (|r| > 0.5)

| öznitelik A | öznitelik B | Pearson r |
|---|---|---:|
| Yaş (yıl) | Kilometre | 0.737 |
| Motor Gücü (hp) | Motor Hacmi (cc) | 0.730 |
| Kapı Boyalı | Çamurluk Boyalı | 0.670 |

### Marka ablasyonu

| kimlik kolonları | MAPE | MAE | R² |
|---|---:|---:|---:|
| yalnız marka | %7.17 | ₺125K | 0.9679 |
| seri + model | %6.50 | ₺110K | 0.9744 |
| marka + seri + model (rapordaki model) | %6.50 | ₺110K | 0.9744 |

Tam modelde yalnız kimlik kolonları değişiyor, diğer öznitelikler sabit; aynı 5-fold OOF. Seri+model yerine yalnız marka verilince MAE ₺15K kötüleşiyor. Seri+modelin üzerine marka eklemek MAE'yi ₺0 değiştiriyor (MAPE farkı 0.00 puan) → model verildiğinde marka bilgi taşımıyor. Yukarıdaki U(marka | model) = 1.00 aynı şeyin bağıntı tarafı.

## 4. Hedef ve önişleme

Ham fiyat sağa çarpık (çarpıklık 1.62); log dönüşümü simetriğe yaklaştırıyor (0.28). Model `log1p(price)` üzerinde eğitildi: uç değerler kareli kayıpta tüm hata bütçesini yutuyordu. Bu bir modelleme kararı, piyasa bulgusu değil.

![Fiyat histogramı — tüm veri (kesikli çizgi = medyan)](figures/tr-25-price-hist.png)

![Kasa tipine göre medyan fiyat](figures/tr-01-body-median.png)

## 5. Piyasa yapısı — segmentasyon (KMeans + PCA)

**k=3 silhouette ile seçilmedi.** k=3 için silhouette 0.146 — denenen 7 değer içinde 7. sırada; en yüksek k=8 (0.211). Hepsi 0.25'in altında: veride belirgin doğal küme yok. k=3 yorumlanabilirlik için sabit seçildi; kümeler aşağıdaki eksenleriyle okunmalı, "piyasanın doğal yapısı" olarak değil. Hasar sinyalinin hedonik model, PCA ve KMeans'te bağımsızca çıkması yine de bir sağlamlık teşhisi.

![k seçimi — Elbow + Silhouette](figures/tr-24-k-selection.png)

![PCA — PC1 %19.7 × PC2 %12.4](figures/tr-22-pca-scatter.png)

![PCA — PC1 %19.7 × PC3 %11.0](figures/tr-23-pca-scatter-13.png)

### Kümeleri ayıran eksenler

| küme | ilan | ortalamadan en çok ayrıldığı 3 eksen |
|---|---:|---|
| Yaşlı & yüksek-km ekonomik · ağır hasar %5 | 9.046 | Kilometre ↑ · Çamurluk Lokal Boya ↑ · Motor Hacmi (cc) ↑ |
| Genç & temiz premium | 15.976 | Kilometre ↓ · Yaş (yıl) ↓ · Motor Hacmi (cc) ↓ |
| Yaşlı & yüksek-km ekonomik · ağır hasar %13 | 4.966 | Kapı Boyalı ↑ · Çamurluk Boyalı ↑ · Çamurluk Değişen ↑ |

↑/↓ = kümenin ortalaması genelin üstünde/altında (z-skoru büyüklüğüne göre ilk 3). Üreticinin aynı adı verdiği kümeler bu sütunda ayrışıyor.

### PCA yükleri

| PC | varyans | en büyük 4 yük |
|---|---:|---|
| PC1 | %19.7 | Kilometre (+0.46) · Yaş (yıl) (+0.45) · Çamurluk Boyalı (+0.41) · Kapı Boyalı (+0.41) |
| PC2 | %12.4 | Motor Gücü (hp) (+0.65) · Motor Hacmi (cc) (+0.61) · Çamurluk Boyalı (-0.24) · Kapı Boyalı (-0.24) |
| PC3 | %11.0 | Çamurluk Lokal Boya (+0.58) · Kapı Lokal Boya (+0.57) · Motor Gücü (hp) (-0.28) · Tampon Lokal Boya (+0.22) |

İlk 3 bileşenin açıkladığı varyans: %43.1. PC1 ≈ Kilometre + Yaş (yıl) · PC2 ≈ Motor Gücü (hp) + Motor Hacmi (cc) · PC3 ≈ Çamurluk Lokal Boya + Kapı Lokal Boya.

## 6. Hedonik model — kontrollü etkiler

Hedonik regresyon her sürücünün *kontrollü* (diğer her şey sabitken) fiyat etkisini verir — R² **0.9309**, n **29.554**. Katsayılar bootstrap ile güven aralıklı; 10 terimin hepsinin %95 GA'sı sıfırı dışlıyor → her sürücü güvenilir şekilde anlamlı.

**Not:** Hedonik model bir OLS modelidir ve eksik değerlerle çalışamaz; bu yüzden eksik motor gücü (426) ve eksik motor hacmi (356) bulunan ilanlar analiz öncesinde elenmiştir. Her iki alanın da ortak eksik olduğu satırlar düşüldüğünde veri setinden toplam 434 satır çıkarılmıştır.

![Bootstrap katsayıları (nokta + %95 GA)](figures/tr-03-bootstrap-ci.png)

### Bootstrap katsayıları

| terim | etki | log katsayı [%95 GA] | etki %95 GA | anlamlı |
|---|---:|---:|---:|---|
| yaş | -%7.12 | -0.0739 [-0.0761, -0.0715] | -%7.33 … -%6.90 | evet |
| yaş² | +%0.08 | +0.0008 [+0.0007, +0.0010] | +%0.07 … +%0.10 | evet |
| km(100K) | -%14.58 | -0.1576 [-0.1674, -0.1479] | -%15.41 … -%13.75 | evet |
| km² | +%1.73 | +0.0172 [+0.0144, +0.0202] | +%1.45 … +%2.04 | evet |
| yaş×km | -%0.66 | -0.0066 [-0.0078, -0.0055] | -%0.78 … -%0.55 | evet |
| ağır hasar | -%11.40 | -0.1210 [-0.1297, -0.1118] | -%12.16 … -%10.58 | evet |
| boyalı | -%1.05 | -0.0106 [-0.0115, -0.0096] | -%1.14 … -%0.96 | evet |
| değişen | -%3.10 | -0.0314 [-0.0336, -0.0294] | -%3.30 … -%2.90 | evet |
| +100 HP | +%21.34 | +0.1935 [+0.1759, +0.2119] | +%19.23 … +%23.60 | evet |
| +1 litre | +%7.71 | +0.0742 [+0.0504, +0.0979] | +%5.17 … +%10.29 | evet |

Etki = exp(β)−1. Kare ve etkileşim terimleri (yaş², km², yaş×km) tek başına okunmaz; eğrinin bükülmesini taşır.

### Motor etkisi

+100 HP → **+%21.3**, +1 litre → **+%7.7** (aynı regresyonda, diğeri sabitken). Hacmin etkisi, güç sabitlendikten sonra kalan kısımdır; birimler farklı olduğu için iki sayı doğrudan kıyaslanmaz.

### Yakıt bazında cc–HP korelasyonu

| yakıt | Pearson | Pearson (log) | Spearman | cc / HP | n |
|---|---:|---:|---:|---:|---:|
| Benzin | 0.806 | 0.731 | 0.407 | 9.8 | 14.693 |
| Dizel | 0.836 | 0.863 | 0.694 | 11.1 | 12.783 |
| LPG & Benzin | 0.900 | 0.863 | 0.805 | 13.9 | 1.199 |
| Hibrit | 0.429 | 0.522 | 0.308 | 10.0 | 879 |

Genel korelasyon 0.73. İlişki yakıta göre değişiyor — en zayıf Hibrit (Pearson 0.429, n 879). Hacim güçten türetilemiyor; ikisi ayrı öznitelik olarak kalır.

### VIF — çoklu bağlantı

| terim | VIF |
|---|---:|
| yaş | 2.57 |
| km | 2.36 |
| ağır hasar | 1.05 |
| boyalı | 1.22 |
| değişen | 1.11 |
| +100 HP | 2.88 |
| motor (L) | 3.19 |

En yüksek **motor (L) 3.19** — hepsi 5'in altında; çoklu bağlantı katsayıları bozmuyor.

### Varsayım testleri

Breusch-Pagan (eşit varyans) p = **<0.001** · Jarque-Bera (normallik) p = **<0.001** → ikisi de ihlal. Bu yüzden çıkarım çıplak OLS p-değeriyle değil, **HC3** robust standart hata + **1000×** bootstrap ile yapıldı.

LOFO ikinci ve bağımsız bir yöntem: her özniteliği çıkarıp CV hatasının ne kadar büyüdüğüne bakar. Aynı sıralamayı vermesi bulgunun kendisi.

![LOFO — öznitelik çıkınca ΔRMSE (çakışmayan gruplar)](figures/tr-04-lofo-flat.png)

Grafik 5 çubuk gösteriyor, model 25 öznitelik kullanıyor. Kapsam:

| kapsam | öznitelik | nerede |
|---|---:|---|
| toplam ölçülen | 19 | 2'si kendi çubuğunda, 17'si grupların içinde |
| grup olarak ölçülen | 3 | `DAMAGE_COLS` · `MODEL_SERIES` · `ENGINE` |
| **hiç ölçülmedi** | **6** | `brand` · `kb_body_type` · `kb_drivetrain` · `segment` · `kb_transmission` · `kb_fuel` |

## 7. Model karşılaştırma ve kısıtlar

Rapordaki model: **LightGBM (model/seri adı TF-IDF+SVD)** — MAPE **%6.5**, R² **0.9744**, MAE **₺110K**. Hedef `log1p(price)`, 25 öznitelik. Model+yıl medyan tabanına göre %42 daha iyi.

**TF-IDF+SVD neye uygulanıyor.** Serbest ilan metnine değil, yalnız `model` ve `series` ad dizgilerine ("A4 Sedan 2.0 TDI" gibi). Amaç, nadir ad kombinasyonlarının isim benzerliği üzerinden komşularından bilgi ödünç almasıdır; target encoding'in seyrek hücrelerde zayıfladığı yeri kapatır. Satıcı açıklaması modele hiçbir biçimde girmez (bkz. §1, üçüncü katman).

### Model varyantları

| varyant | MAPE | R² | MAE | MedAE | RMSE |
|---|---:|---:|---:|---:|---:|
| LightGBM (model/seri adı TF-IDF+SVD) | %6.50 | 0.9744 | ₺110.072 | ₺75.282 | ₺176.576 |
| CatBoost (model/seri adı TF-IDF+SVD) ★ | %6.45 | 0.9742 | ₺110.294 | ₺74.660 | ₺177.186 |
| CatBoost (model/seri adı native text) | %6.59 | 0.9734 | ₺113.125 | ₺77.772 | ₺179.772 |
| model+yıl medyanı (taban) | %11.20 | 0.9235 | ₺191.224 | ₺130.000 | ₺305.050 |

★ = üreticinin kuralıyla kazanan (yalnız MAPE'ye bakar): **CatBoost (model/seri adı TF-IDF+SVD)**. Ama iki TF-IDF+SVD varyantı arasındaki fark 0.05 MAPE puanı ve ₺222 MAE; LightGBM şu metriklerde önde: MAE, RMSE, R²; CatBoost şunlarda: MAPE, MedAE → pratikte **eşitler**. Rapor boyunca "model" LightGBM'dir: CPU'da deterministik, CatBoost'un ağaçları ise cihaza (GPU/CPU) göre değişir — yayımlanan GPU koşumunda MAPE sırası tersti. Conformal aralık, marka ablasyonu ve örnek tahminler LightGBM'den.

### Taban basamak kırılımı

| basamak | ilan | pay | MAPE | MAE | R² |
|---|---:|---:|---:|---:|---:|
| model+yıl | 29.236 | %97.49 | %10.69 | ₺179K | 0.9450 |
| model | 596 | %1.99 | %26.70 | ₺559K | 0.6082 |
| global | 156 | %0.52 | %47.38 | ₺1.10M | -0.2359 |

Merdiven: (model, yıl) medyanı → (model) medyanı — tüm yıllar → global medyan. Test'teki (model, yıl) hücresi eğitim fold'unda yoksa taban bir alt basamağa iner; her inişte hata belirgin büyür — emsalsiz araçta taban zaten zayıf. Medyanlar her fold'da yalnız eğitim kısmından hesaplanır (sızıntısız, modelle aynı 5-fold).

**Model Kısıtları ve Gözlemler.** Tahmin sapmalarının başlıca kaynağı; araçtaki modifiye, özel donanım veya ÖTV muafiyeti gibi form alanlarında yer almayıp serbest metne gizlenen örtük bilgilerdir. Benzer şekilde, veri kümesinde emsali sınırlı olan niş lüks ve sportif araçlarda örneklem yetersizliği nedeniyle hata payı belirgin şekilde artmaktadır. Performans tavanının algoritma ayarlarından ziyade veri kapsamıyla sınırlı olması nedeniyle, marjinal kazancı kısıtlı kalacak kapsamlı bir hiperparametre optimizasyonuna bilinçli olarak gidilmemiştir.

### Örnek tahminler

| bant | araç | yaş | km | gerçek | LightGBM | sapma | OOF artık | CatBoost (model/seri adı SVD) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| ekonomik | A3 Sportback 1.4 TFSI Attraction | 16 | 216.000 | ₺770.000 | ₺754.463 | %2.0 | %0.0 | ₺796.416 |
| orta | 520i Premium | 13 | 230.000 | ₺1.525.000 | ₺1.527.918 | %0.2 | %0.0 | ₺1.492.718 |
| premium | A3 Sedan 35 TFSI Advanced | 1 | 11.000 | ₺2.867.000 | ₺2.832.053 | %1.2 | %0.0 | ₺2.879.939 |

> **Bunlar tipik değil, en iyi durum örnekleri.** Üretici her fiyat tercilinde ağır hasarsız ve |OOF artık|'ı en küçük ilanı seçer. "sapma" tüm veriyle eğitilmiş final modelin tahminidir (ilanı eğitimde görmüştür); sızıntısız ölçü "OOF artık". Tipik hata için MAPE'ye bakın.

## 8. Kalibrasyon, artıklar ve zayıflık

OOF (sızıntısız) tahminler gerçek fiyata karşı — R² **0.9744**. Artık% sıfır etrafında (ort. %-0.48, std %9.31) → sistematik yanlılık yok.

![Tahmin vs Gerçek (R² 0.974)](figures/tr-08-pred-vs-true.png)

### Hata dağılımı

| \|hata\| bandı | ilan | pay |
|---|---:|---:|
| ≤ %5 | 15.725 | %52.4 |
| %5 – %10 | 8.251 | %27.5 |
| %10 – %20 | 4.825 | %16.1 |
| > %20 | 1.187 | %4.0 |

![OOF hata dağılımı — artık % = (gerçek − tahmin) / gerçek](figures/tr-26-error-hist.png)

Tüm 29.988 ilanın OOF hatası. Dağılım sıfırda tepe yapıyor (medyan artık -%0.26); ±%10 içinde kalan ilan payı **%80.0**. Ortalama |hata| %6.5 — MAPE'nin kendisi; medyan |hata| %4.7. Kuyruk asimetrik, fazla tahmin tarafı daha kalın: model gerçeğin %20'den fazla **üstünü** 761 ilanda, **altını** 426 ilanda söylüyor (en uçlar -%178.4 ve +%55.3). Asimetrinin bir kısmı tanımdan gelir: artık gerçek fiyata bölündüğü için düşük tahmin en fazla %100 olabilir, fazla tahminin sınırı yoktur. Std (%9.31) bu kuyruk yüzünden şişik; tipik hatayı medyan |hata| daha iyi anlatır.

### Büyük hatalar nereden geliyor

Hatası ±%20 sınırını aşan 1.187 ilan (761 fazla, 426 düşük tahmin). Aşağıdaki kırılımlar yalnız yapısal alanlardan sayılır — metin dedektörüne dayanmaz.

| aynı model+yılda ilan | ilan | büyük hata | fazla tahmin | düşük tahmin |
|---|---:|---:|---:|---:|
| 1 | 610 | %19.2 | %11.5 | %7.7 |
| 2–4 | 1.584 | %10.6 | %6.3 | %4.3 |
| 5–19 | 5.732 | %4.6 | %3.0 | %1.6 |
| 20–99 | 16.505 | %2.9 | %1.9 | %1.0 |
| 100+ | 5.557 | %2.8 | %1.9 | %0.9 |

1. **Emsal yok.** Aynı model ve yıldan başka ilan yoksa büyük hata oranı %19.2, 100+ emsal varsa %2.8. Model görmediği aracı fiyatlayamıyor.
2. **Uç ya da yaşlı araç.** F/S segmentte %20.6 (diğerleri %3.8); yaş ≥ 18'de %11.6 (daha gençlerde %3.2). Form alanları bu araçlardaki fiyat farkını açıklamaya yetmiyor.
3. **Zaman.** Model dönem bilmiyor: medyan artık ilk dönemde (2026-01-18) -%3.39, son dönemde (2026-06-27) +%1.42 — piyasa yükseldikçe önce pahalı, sonra ucuz söylüyor.

İlişki; ilan ilan doğrulanmadı. Formda olmayan bilgi (hasar geçmişi, donanım, modifiye) olası katkı, burada ölçülmedi.

#### Örnekler

| araç | yıl | km | fiyat | model tahmini | artık |
|---|---:|---:|---:|---:|---:|
| BMW 640i | 2011 | 160.000 | ₺5.600.000 | ₺3.238.105 | +%42.2 |
| Audi 4.2 FSI Quattro R-tronic (R8) | 2008 | 112.550 | ₺4.690.000 | ₺2.610.304 | +%44.3 |
| BMW 750i Long | 2007 | 271.000 | ₺1.190.000 | ₺3.115.921 | -%161.8 |

- **BMW 640i · 2011:** İlan metnine göre araç komple M6 dönüşümü: M6 motoru ve M6 kasa parçaları takılmış. Form hâlâ 640i dediği için model onu sıradan bir 640i gibi fiyatlıyor; alıcı ise bir M6'ya bakıyor.
- **Audi 4.2 FSI Quattro R-tronic (R8) · 2008:** Veride tek R8. Formdaki model adı yalnız "4.2 FSI Quattro R-tronic"; aynı motor adını taşıyan S5 4.2 FSI Quattro'ların medyanı ₺2.62M ve model tahmini buna neredeyse eşit. Emsali olmayan bir süper otomobili model, adı benzeyen S5 gibi fiyatlamış.
- **BMW 750i Long · 2007:** Veride bu addan iki ilan var; diğeri ₺5.3M'lik dönüşümlü bir 2009 araç. Bu ilan ise aynı yılın 730d'leriyle (15 ilan, medyan ₺1.18M) uyumlu ve metni bakımlı, masrafsız diyor. İlan piyasaya uygun, yanılan model: emsali olmadığı için muhtemelen adın diğer, pahalı ilanından etkileniyor.

![Artık% vs Tahmin](figures/tr-09-residual.png)

![Emsali az olan modelde hata büyük — model başına medyan hata](figures/tr-11-n-vs-error.png)

Her nokta bir model; y ekseni o modelin ilanlarındaki medyan hata. Kova medyanı tek ilanlı modellerde %10.1, 100+ ilanlıda %4.6. Yukarıdaki tablo iki yönden farklı ölçer: büyük hata **oranını** sayar ve ilanları model+**yıl** bazında gruplar. İkisi aynı yönü gösteriyor — emsal azaldıkça hata büyüyor.

**Conformal aralık**, modelin tek bir fiyatın yanında veriye dayalı bir fiyat bandı da (örneğin ₺1.34M – ₺1.78M) sunmasıdır.

* **Dağılım varsayımı yapmaz:** Hataların bir formüle (çan eğrisi vb.) uyduğu varsayılmaz. Modelin daha önce hiç görmediği araçlardaki gerçek hataları sıralanır, en kötü %10'u dışarıda bırakılır ve pay doğrudan veriden okunur. Tek varsayım, yeni ilanların eskilere benzemesidir — piyasa kaydıkça (§9) bu varsayım zayıflar.
* **Oransaldır:** Hata payı lira değil yüzde olarak uygulanır (tahminin yaklaşık %13 altı ile %15 üstü). Bu yüzden pahalı araçta lira bandı geniş, ucuz araçta dar çıkar.
* **Kısıtı:** Tüm piyasaya tek bir yüzde uygulandığı için, modelin oransal olarak daha çok yanıldığı ucuz araçlarda bant fazla dar kalıyor (aşağıdaki kapsama grafiği). Çözüm, hata payını tek bir sayı yerine fiyat bandına göre ayrı ayrı hesaplamaktır; bu raporda yapılmadı.

**Zayıflık fiyata bağlı:** medyan hata en ucuz çeyrekte %6.97, en pahalıda %3.54. Conformal %90 aralık her yerde tutmuyor; örneğin Q1 kapsaması %81.6.

![Fiyat çeyreğine göre medyan hata (%)](figures/tr-10-quartile-error.png)

![%90 aralık kaç ilanda tuttu (hedef %90)](figures/tr-12-coverage.png)

| çeyrek | fiyat aralığı | kapsama |
|---|---|---:|
| Q1 | ₺1.15M altı | %81.6 |
| Q2 | ₺1.15M – ₺1.54M | %91.9 |
| Q3 | ₺1.54M – ₺2.27M | %92.6 |
| Q4 | ₺2.27M üstü | %94.1 |

**Not:** Fiyat çeyrekleri gerçek değerler üzerinden dilimlenmiştir. Genel kapsama tanım gereği %90.0 seviyesindedir; yalnız Q1 hedefin altında kalmaktadır.

### En iyi 5 tahmin

| model | yaş | km | gerçek | OOF tahmin | hata |
|---|---:|---:|---:|---:|---:|
| A3 Sedan 35 TFSI Advanced | 1 | 11.000 | ₺2.867.000 | ₺2.867.018 | %0.0 |
| 520i Premium | 13 | 230.000 | ₺1.525.000 | ₺1.524.988 | %0.0 |
| 525d xDrive Exclusive | 13 | 235.000 | ₺1.680.000 | ₺1.679.985 | %0.0 |
| 320i ED Luxury Line | 13 | 210.036 | ₺1.359.000 | ₺1.359.014 | %0.0 |
| A3 Sportback 1.6 TDI Design Line | 8 | 112.750 | ₺1.690.000 | ₺1.689.980 | %0.0 |

29.988 ilanda birkaç tahminin gerçeğe liralar düzeyinde denk gelmesi şans eseri de beklenir; bu tablo modelin tipik kalitesini değil, hata dağılımının sıfır ucunu gösterir.

### En çok yanıldığı 6 ilan

| model | yaş | km | gerçek | OOF tahmin | hata |
|---|---:|---:|---:|---:|---:|
| A4 Sedan 2.0 TDI | 20 | 355.000 | ₺644.000 | ₺1.792.742 | %178.4 |
| 750i Long | 19 | 271.000 | ₺1.190.000 | ₺3.115.921 | %161.8 |
| 745i Long | 21 | 280.000 | ₺885.000 | ₺2.066.226 | %133.5 |
| M2 | 10 | 153.000 | ₺1.650.000 | ₺3.325.961 | %101.6 |
| 1.8 1.8 T | 20 | 96.000 | ₺950.000 | ₺1.816.088 | %91.2 |
| 320i ED M Plus | 13 | 240.000 | ₺1.400.000 | ₺2.584.235 | %84.6 |

En kötü 6 ilanın 6 tanesinde model gerçek fiyatın **üstünü** söylüyor; medyan yaş 20. Yapısal alanlarda görünmeyen bir durum (hasar geçmişi, proje araç, nadir varyant) olası açıklama — bu raporda ilan ilan doğrulanmadı. Tüm tahminler OOF; ilan kimliği (`ad_id`) bilerek yazılmadı.

## 9. Zaman — dönem etkisi, dağılım kayması ve backtest

İki kanıt aynı kararı veriyor. Dağılım kayması: dönemler arası eğriler neredeyse çakışık. Zamansal backtest: eski dönemde eğit, sonraki dönemin yalnızca YENİ ilanlarında test et (sızıntısız). Sonuç: piyasa SEVİYESİ +%5.3 kaydı ama ŞEKİL sabit → aylık yeniden eğitim yeter.

### Dönem etkisi

| dönem | fiyat seviyesi (taban 01-18) |
|---|---:|
| 01-18 (taban) | %0.00 |
| 01-27 | +%1.54 |
| 03-21 | +%3.17 |
| 06-27 | +%5.30 |

Hedonik model dönem kuklalarıyla zamanı kontrol eder: aynı araç için fiyat seviyesi 4 dönemde **+%5.3** kaydı. Rapordaki model (LightGBM) zamansızdır — dönem özniteliği almaz.

### Zamansal backtest

| tek dönem: eğitim → test | MAPE | n | kümülatif: eğitim → test | MAPE | n |
|---|---:|---:|---|---:|---:|
| 01-18 → 01-27 | %6.58 | 2.960 | ≤01-18 → 01-27 | %6.58 | 2.960 |
| 01-18 → 03-21 | %6.80 | 8.182 | ≤01-18 → 03-21 | %6.80 | 8.182 |
| 01-18 → 06-27 | %7.55 | 10.529 | ≤01-18 → 06-27 | %7.55 | 10.529 |
| 01-27 → 03-21 | %6.62 | 7.413 | ≤01-27 → 03-21 | %6.55 | 7.238 |
| 01-27 → 06-27 | %7.31 | 10.313 | ≤01-27 → 06-27 | %7.35 | 10.257 |
| 03-21 → 06-27 | %7.06 | 9.099 | ≤03-21 → 06-27 | %6.96 | 8.889 |

Tek dönem = yalnız bir taramada eğit, sonrakini tahmin et. Kümülatif = t'ye kadarki tüm taramalarda eğit. Test kümesi yalnız eğitimde hiç görülmemiş `ad_id`'ler (sızıntısız); bu yüzden kümülatif n tek dönemden küçük ya da eşit. Aynı eğitim döneminden test ufku uzadıkça hata büyüyor.

### Dönem başına OOF

| dönem (bağımsız) | MAPE | n | kümülatif | MAPE | n |
|---|---:|---:|---|---:|---:|
| 01-18 | %7.04 | 10.901 | ≤01-18 | %7.05 | 10.901 |
| 01-27 | %7.00 | 11.254 | ≤01-27 | %6.85 | 13.861 |
| 03-21 | %7.02 | 11.478 | ≤03-21 | %6.52 | 21.099 |
| 06-27 | %7.23 | 11.526 | ≤06-27 | %6.52 | 29.988 |

![Daha çok veri, daha az hata — tek dönem vs biriken dönemler](figures/tr-15-backtest.png)

### Dağılım kayması

| dönem çifti | KS | KS p | PSI | EMD (₺) |
|---|---:|---:|---:|---:|
| 01-18→01-27 | 0.0055 | 0.996 | 0.0004 | ₺10.109 |
| 01-18→03-21 | 0.0173 | 0.070 | 0.0015 | ₺20.560 |
| 01-18→06-27 | 0.0309 | <0.001 | 0.0049 | ₺48.059 |
| 01-27→03-21 | 0.0161 | 0.104 | 0.0011 | ₺15.717 |
| 01-27→06-27 | 0.0301 | <0.001 | 0.0038 | ₺39.115 |
| 03-21→06-27 | 0.0157 | 0.118 | 0.0017 | ₺28.620 |

**Sütunlar ne ölçüyor.** Dördü de iki dönemin **ilan fiyatı dağılımını** karşılaştırır (ham fiyat, ₺; her dönemin o gün ilanda olan tüm ilanları, dönem başına ~11 bin).

| ölçü | ne ölçer, nasıl okunur |
|---|---|
| **KS** | İki dağılımın en çok ayrıldığı nokta; 0–1 arası. "Şu fiyatın altında kalan ilan payı" iki dönemde en fazla ne kadar farklı? 0.031 = en ayrık noktada 3.1 puan fark. |
| **KS p** | Bu fark şans eseri olabilir mi? 0.05'in altı → fark gerçek. Ama **büyüklüğünü söylemez**: ~11 bin ilanlık örneklemlerde çok küçük bir fark bile anlamlı çıkar. |
| **PSI** | Fark pratikte büyük mü? İlk dönemin fiyatları 10 dilime bölünür; ikinci dönemde bu dilimlerin payı ne kadar kaymış? < 0.10 kayma yok · 0.10–0.25 orta · > 0.25 büyük, model yeniden eğitilmeli. |
| **EMD (₺)** | Fark kaç lira? Bir dönemin fiyat dağılımını ötekine çevirmek için fiyatların ortalama kaç lira kaydırılması gerektiği. Lira cinsinden tek ölçü olduğu için en doğrudan okunanı bu. |

**Tablonun söylediği.** İki çiftte KS p 0.05'in altında — yani Ocak ile Haziran arasında fiyat dağılımı **gerçekten** değişmiş. Ama değişim küçük: en yüksek PSI 0.0049, "kayma yok" eşiğinin (0.10) yirmide biri. EMD bunu liraya çeviriyor: dokuz günde ~₺10 bin, beş ayda ~₺48 bin — medyan ilan fiyatının (₺1.54M) yaklaşık %3'ü. Kayma dönemler arası mesafeyle birlikte büyüyor, ama modelin öğrendiği yapıyı bozacak düzeyde değil.

![Fiyat dağılımı — dönemlere göre](figures/tr-13-drift-hist.png)

![Log-fiyat yoğunluğu — dönemlere göre](figures/tr-14-drift-kde.png)

## 10. Serbest metin: ölçüldü, dahil edilmedi

Satıcı açıklaması modele **girmiyor**. Bu bir ihmal değil, ölçüm sonucu: aynı çapraz-doğrulama protokolünde yapısal model R² **0.9645**, üstüne metin öznitelikleri eklenince **0.966** — ΔR² **0.0015**. Formda zaten olan bilginin üstüne metin doğruluk eklemiyor.

Metinden yapılandırılmış bilgi çıkarmak ayrıca denendi: **LangExtract** kütüphanesi ve **gemini-3.1-flash-lite** ile ilan metinlerindeki hasar, bakım ve modifiye ifadeleri parça ve durum niteliğiyle çıkarıldı.

Bu çıkarımlar ne modele ne rapora girdi, çünkü **doğrulukları ölçülemedi**. Ölçmek için zor/orta/kolay ilanlardan dengeli bir doğrulama kümesi kurup elle etiketlemek gerekiyor; o emek harcanmadan modelin ne zaman yanıldığı bilinmiyor. Ölçemediğimiz bir sinyalin üstüne karar kurulmadı.

Yapılması gereken belli: çıkarımlar önce doğrulanmalı, sonra modele **temiz sinyal** olarak verilip katkısı aynı protokolle test edilmeli. İki engel var. Birincisi **örneklem**: modifiye ya da ağır bakım geçmiş ilan korpusun küçük bir bölümü; yeterli örnek yoksa model bu sinyali öğrenemez, gürültüye karışır. İkinci yol sinyali modele hiç vermeden bu ilanları **veriden çıkarmak** ve hata payının ne kadar düştüğünü ölçmek. Hangisi seçilirse seçilsin, sonuç **canlı ilanlarda** da sınanmadan kabul edilmemeli.

