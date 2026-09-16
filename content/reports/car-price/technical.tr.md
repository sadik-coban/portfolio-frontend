# Car Price — Teknik Rapor

> Üretilmiş dosya — kaynak `clean/data/site_data.json`, üreteç `clean/car_price_report/build_report.py`. Her sayı JSON'dan okunur.

Karar özeti: [business.tr.md](business.tr.md)

## 1. Veri, dedup ve sızıntı

**45.159 snapshot → 29.988 ilan.** Aradaki 15.171 satır aynı ilanın tekrar taranması — veri değil, tarama artığı. `ad_id` başına en son snapshot alındı.

Medyan ilan fiyatı ₺1.54M, ₺0.84M–₺3.42M arası (P10–P90).

### Ölçek

| kalem | değer |
|---|---:|
| ham satır (tüm snapshot'lar) | 45.159 |
| tekil ilan (`ad_id` dedup) | 29.988 |
| dönem | 4 (2026-01-18 – 2026-06-27) |
| modele giren öznitelik | 25 |
| BMW / Audi | 17.896 / 12.092 |
| hedef | `log1p(price)` |

### Üç veri katmanı

1. **Yapısal** — yaş · km · motor gücü/hacmi · kasa · yakıt · vites · çekiş · segment.
2. **Hasar / ekspertiz** — her kaporta paneli × {değişen, boyalı, lokal boya} + tramer + ağır hasar.
3. **Serbest metin** — satıcı açıklaması; bu raporda değil, ayrı metin analizinde (beyan · donanım · anomali).

### Tutulan öznitelikler (25)

Model (`model`) · Seri (`series`) · Marka (`brand`) · Kasa Tipi (`kb_body_type`) · Çekiş (`kb_drivetrain`) · Segment (`segment`) · Vites Tipi (`kb_transmission`) · Yakıt Tipi (`kb_fuel`) · Tavan Durumu (`roof_state`) · Kaput Durumu (`hood_state`) · Bagaj Durumu (`trunk_state`) · Yaş (yıl) (`vehicle_age`) · Kilometre (`gb_mileage`) · Motor Gücü (hp) (`power_hp_val`) · Motor Hacmi (cc) (`engine_cc_val`) · Kapı Değişen (`door_changed`) · Kapı Boyalı (`door_painted`) · Kapı Lokal Boya (`door_local`) · Çamurluk Değişen (`fender_changed`) · Çamurluk Boyalı (`fender_painted`) · Çamurluk Lokal Boya (`fender_local`) · Tampon Değişen (`bumper_changed`) · Tampon Boyalı (`bumper_painted`) · Tampon Lokal Boya (`bumper_local`) · Ağır Hasarlı (`is_heavy_damaged`)

### Atılan öznitelik grupları

| grup | gerekçe | ~kolon |
|---|---|---:|
| A | Sabit varyans | ~2 |
| B | Redundant kb/gb | ~12 |
| B* | Kapsam farkı | 1 |
| C | Kimlik/sızıntı | ~8 |
| D | Blok-eksik>%40 | ~15 |
| E | Spec-eksik~%26 | ~10 |

Hiyerarşik doldurma: seri>segment>marka medyanı. torque_nm %27.6 eksik olduğu için çıkarıldı.

**Sızıntı kontrolü.** Dedup `ad_id` üzerinden ve CV'den ÖNCE yapıldı. Değerlendirme 5-fold out-of-fold: her ilan tam olarak bir kez, kendisini görmemiş bir modelle tahmin edildi.

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

30 kolon %2'nin üzerinde eksik ve bir kısmı **birlikte** düşüyor. Bu "eksik veri" değil, katalog eşleşmesinin çöktüğü ilanlar: standart modeller eşleşir, niş varyantlar eşleşmez, tüm spec birden boşalır. Sistematik olduğu için güvenilir imputasyon yok → bu kolonlar çıkarıldı.

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

İlan sayfası aynı bilgiyi iki sekmede taşıyabiliyor. İkizi olan 1 alanda dolu taraf (kb) kullanıldı; ikizi olmayan 3 alan (sigorta/vergi) %40 eşiğini aştığı için atıldı.

## 3. Fazlalık ve bağıntı kontrolleri

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

Model seriyi 1.00 belirliyor, seri modeli yalnız 0.39. Marka hem modelden hem seriden tamamen okunuyor → marka ayrı bilgi taşımaz (§9'daki ablasyon aynı sonucu ölçer).

Sayısal öznitelikler arası korelasyon — yukarıdaki kategorik bağıntının sayısal karşılığı. |r|>0.5 çiftler çoklu-bağlantı için işaretlendi (VIF ile de kontrol edildi, §4).

![Pearson](figures/tr-20-pearson.png)

![Spearman](figures/tr-21-spearman.png)

### Yüksek korelasyon çiftleri (|r| > 0.5)

| öznitelik A | öznitelik B | Pearson r |
|---|---|---:|
| Yaş (yıl) | Kilometre | 0.737 |
| Motor Gücü (hp) | Motor Hacmi (cc) | 0.730 |
| Kapı Boyalı | Çamurluk Boyalı | 0.670 |

## 4. Hedonik model — kontrollü etkiler

Hedonik regresyon her sürücünün *kontrollü* (diğer her şey sabitken) fiyat etkisini verir — R² **0.9309**, n **29.554**. Katsayılar bootstrap ile güven aralıklı; 10 terimin hepsinin %95 GA'sı sıfırı dışlıyor → her sürücü güvenilir şekilde anlamlı.

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

### Dönem etkisi

| dönem | fiyat seviyesi (taban 01-18) |
|---|---:|
| 01-18 (taban) | %0.00 |
| 01-27 | +%1.54 |
| 03-21 | +%3.17 |
| 06-27 | +%5.30 |

Hedonik model dönem kuklalarıyla zamanı kontrol eder: aynı araç için fiyat seviyesi 4 dönemde **+%5.3** kaydı. Rapordaki model (LightGBM) zamansızdır — dönem özniteliği almaz.

### Varsayım testleri

Breusch-Pagan (eşit varyans) p = **<0.001** · Jarque-Bera (normallik) p = **<0.001** → ikisi de ihlal. Bu yüzden çıkarım çıplak OLS p-değeriyle değil, **HC3** robust standart hata + **1000×** bootstrap ile yapıldı.

LOFO ikinci ve bağımsız bir yöntem: her özniteliği çıkarıp CV hatasının ne kadar büyüdüğüne bakar. Aynı sıralamayı vermesi bulgunun kendisi.

![LOFO — öznitelik çıkınca ΔRMSE (çakışmayan gruplar)](figures/tr-04-lofo-flat.png)

> **Not — düz LOFO.** Ham `methodology.lofo` hem tekil hem grup çıkarmaları bir arada taşıyor; ikisini aynı eksende basmak çift sayım olur (`DAMAGE_COLS` kendi 13 üyesiyle yarışır). Yukarıdaki grafik **çakışmayan** 5 gruba indirgenmiştir ve 25 özniteliğin 19'unu kapsar. Kalan 6 kategorik öznitelik (`brand`, `kb_body_type`, `kb_drivetrain`, `segment`, `kb_transmission`, `kb_fuel`) LOFO'da **hiç ölçülmemiştir** — üretici yalnız sayısal ve metin özniteliklerini geziyor. "km ve yaş baskın" sonucu bu sınır içinde okunmalıdır.

## 5. Model karşılaştırma ve gürültü tabanı

Rapordaki model: **LightGBM (TF-IDF+SVD)** — MAPE **%6.5**, R² **0.9744**, MAE **₺110K**. Hedef `log1p(price)`, 25 öznitelik. Model+yıl medyan tabanına göre %42 daha iyi.

### Model varyantları

| varyant | MAPE | R² | MAE | MedAE | RMSE |
|---|---:|---:|---:|---:|---:|
| LightGBM (TF-IDF+SVD) | %6.50 | 0.9744 | ₺110.072 | ₺75.282 | ₺176.576 |
| CatBoost (TF-IDF+SVD) ★ | %6.45 | 0.9742 | ₺110.294 | ₺74.660 | ₺177.186 |
| CatBoost (native text) | %6.59 | 0.9734 | ₺113.125 | ₺77.772 | ₺179.772 |
| model+yıl medyanı (taban) | %11.20 | 0.9235 | ₺191.224 | ₺130.000 | ₺305.050 |

★ = üreticinin kuralıyla kazanan (yalnız MAPE'ye bakar): **CatBoost (TF-IDF+SVD)**. Ama iki TF-IDF+SVD varyantı arasındaki fark 0.05 MAPE puanı ve ₺222 MAE; LightGBM şu metriklerde önde: MAE, RMSE, R²; CatBoost şunlarda: MAPE, MedAE → pratikte **eşitler**. Rapor boyunca "model" LightGBM'dir: CPU'da bit-birebir deterministik, CatBoost'un ağaçları ise cihaza (GPU/CPU) göre değişir — yayımlanan GPU koşumunda MAPE sırası tersti. Gürültü tabanı, conformal aralık, marka ablasyonu ve örnek tahminler LightGBM'den.

### Taban basamak kırılımı

| basamak | ilan | pay | MAPE | MAE | R² |
|---|---:|---:|---:|---:|---:|
| model+yıl | 29.236 | %97.49 | %10.69 | ₺179K | 0.9450 |
| model | 596 | %1.99 | %26.70 | ₺559K | 0.6082 |
| global | 156 | %0.52 | %47.38 | ₺1.10M | -0.2359 |

Merdiven: (model, yıl) medyanı → (model) medyanı — tüm yıllar → global medyan. Test'teki (model, yıl) hücresi eğitim fold'unda yoksa taban bir alt basamağa iner; her inişte hata belirgin büyür — emsalsiz araçta taban zaten zayıf. Medyanlar her fold'da yalnız eğitim kısmından hesaplanır (sızıntısız, modelle aynı 5-fold).

**Gürültü tabanı.** Aynı spec'teki araçlar (aynı model · yıl · km · hp · kasa) birbirinden **₺77K** aralıkla ilan ediliyor — 5.767 satır, 2.577 grup. Bu bir taban: aynı arabayı satıcılar farklı fiyatlıyor ve hiçbir model bunun altına inemez. Model ₺110K'de, yani tabanın **1.42 katında**; geriye kalan tüm pay ₺33K. Hiperparametre araması tipik olarak bunun ~₺5K'sini alır, o yüzden yapılmadı.

### Örnek tahminler

| bant | araç | yaş | km | gerçek | LightGBM | sapma | OOF artık | CatBoost (SVD) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| ekonomik | A3 Sportback 1.4 TFSI Attraction | 16 | 216.000 | ₺770.000 | ₺754.463 | %2.0 | %0.0 | ₺796.416 |
| orta | 520i Premium | 13 | 230.000 | ₺1.525.000 | ₺1.527.918 | %0.2 | %0.0 | ₺1.492.718 |
| premium | A3 Sedan 35 TFSI Advanced | 1 | 11.000 | ₺2.867.000 | ₺2.832.053 | %1.2 | %0.0 | ₺2.879.939 |

> **Bunlar tipik değil, en iyi durum örnekleri.** Üretici her fiyat tercilinde ağır hasarsız ve |OOF artık|'ı en küçük ilanı seçer. "sapma" tüm veriyle eğitilmiş final modelin tahminidir (ilanı eğitimde görmüştür); sızıntısız ölçü "OOF artık". Tipik hata için MAPE'ye bakın.

## 6. Kalibrasyon, artıklar ve zayıflık

OOF (sızıntısız) tahminler gerçek fiyata karşı — R² **0.9744**. Artık% sıfır etrafında (ort. %-0.48, std %9.31) → sistematik yanlılık yok.

![Tahmin vs Gerçek (R² 0.974)](figures/tr-08-pred-vs-true.png)

![Artık% vs Tahmin](figures/tr-09-residual.png)

![Model ilan-adedi vs medyan hata (log eksen)](figures/tr-11-n-vs-error.png)

Zayıflık fiyata bağlı: medyan hata en ucuz çeyrekte %6.97, en pahalıda %3.54. Conformal %90 aralık aynı yerde tutmuyor — Q1 kapsaması %81.6.

![Fiyat çeyreğine göre medyan hata (%)](figures/tr-10-quartile-error.png)

![Conformal kapsama % (hedef %90)](figures/tr-12-coverage.png)

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

## 7. Dağılım kayması ve zamansal backtest

İki kanıt aynı kararı veriyor. Dağılım kayması: dönemler arası eğriler neredeyse çakışık. Zamansal backtest: eski dönemde eğit, sonraki dönemin yalnızca YENİ ilanlarında test et (sızıntısız). Sonuç: piyasa SEVİYESİ +%5.3 kaydı ama ŞEKİL sabit → aylık yeniden eğitim yeter.

### Zamansal backtest

| tek dönem: eğitim → test | MAPE | n | kümülatif: eğitim → test | MAPE | n |
|---|---:|---:|---|---:|---:|
| 01-18 → 01-27 | %6.58 | 2.960 | ≤01-18 → 01-27 | %6.58 | 2.960 |
| 01-18 → 03-21 | %6.80 | 8.182 | ≤01-18 → 03-21 | %6.80 | 8.182 |
| 01-18 → 06-27 | %7.55 | 10.529 | ≤01-18 → 06-27 | %7.55 | 10.529 |
| 01-27 → 03-21 | %6.62 | 7.413 | ≤01-27 → 03-21 | %6.55 | 7.238 |
| 01-27 → 06-27 | %7.31 | 10.313 | ≤01-27 → 06-27 | %7.35 | 10.257 |
| 03-21 → 06-27 | %7.06 | 9.099 | ≤03-21 → 06-27 | %6.96 | 8.889 |

Tek dönem = yalnız bir snapshot'ta eğit, sonrakini tahmin et. Kümülatif = t'ye kadarki tüm snapshot'larda eğit. Test kümesi yalnız eğitimde hiç görülmemiş `ad_id`'ler (sızıntısız); bu yüzden kümülatif n tek dönemden küçük ya da eşit. Aynı eğitim döneminden test ufku uzadıkça hata büyüyor.

### Dönem başına OOF

| dönem (bağımsız) | MAPE | n | kümülatif | MAPE | n |
|---|---:|---:|---|---:|---:|
| 01-18 | %7.04 | 10.901 | ≤01-18 | %7.05 | 10.901 |
| 01-27 | %7.00 | 11.254 | ≤01-27 | %6.85 | 13.861 |
| 03-21 | %7.02 | 11.478 | ≤03-21 | %6.52 | 21.099 |
| 06-27 | %7.23 | 11.526 | ≤06-27 | %6.52 | 29.988 |

![OOF MAPE — dönem başına vs kümülatif](figures/tr-15-backtest.png)

### Dağılım kayması

| dönem çifti | KS | KS p | PSI | EMD (₺) |
|---|---:|---:|---:|---:|
| 01-18→01-27 | 0.0055 | 0.996 | 0.0004 | ₺10.109 |
| 01-18→03-21 | 0.0173 | 0.070 | 0.0015 | ₺20.560 |
| 01-18→06-27 | 0.0309 | <0.001 | 0.0049 | ₺48.059 |
| 01-27→03-21 | 0.0161 | 0.104 | 0.0011 | ₺15.717 |
| 01-27→06-27 | 0.0301 | <0.001 | 0.0038 | ₺39.115 |
| 03-21→06-27 | 0.0157 | 0.118 | 0.0017 | ₺28.620 |

PSI eşikleri: < 0.10 güvenli, > 0.25 yeniden eğitim. En yüksek PSI **0.0049** — güvenli eşiğin altında. 2 çiftte KS p < 0.05: n büyük olduğunda çok küçük bir fark bile anlamlı çıkar; büyüklüğü PSI ve EMD söyler.

![Fiyat dağılımı — dönemlere göre](figures/tr-13-drift-hist.png)

![Log-fiyat yoğunluğu — dönemlere göre](figures/tr-14-drift-kde.png)

## 8. Segmentasyon — KMeans + PCA

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

## 9. Marka

### Marka ablasyonu

| kimlik kolonları | MAPE | MAE | R² |
|---|---:|---:|---:|
| yalnız marka | %7.17 | ₺125K | 0.9679 |
| seri + model | %6.50 | ₺110K | 0.9744 |
| marka + seri + model (rapordaki model) | %6.50 | ₺110K | 0.9744 |

Tam modelde yalnız kimlik kolonları değişiyor, diğer öznitelikler sabit; aynı 5-fold OOF. Seri+model yerine yalnız marka verilince MAE ₺15K kötüleşiyor. Seri+modelin üzerine marka eklemek MAE'yi ₺0 değiştiriyor (MAPE farkı 0.00 puan) → model verildiğinde marka bilgi taşımıyor. §3'teki U(marka | model) = 1.00 aynı şeyin bağıntı tarafı.

## 10. Hedef ve önişleme

Ham fiyat sağa çarpık (çarpıklık 1.62); log dönüşümü simetriğe yaklaştırıyor (0.28). Model `log1p(price)` üzerinde eğitildi: uç değerler kareli kayıpta tüm hata bütçesini yutuyordu. Bu bir modelleme kararı, piyasa bulgusu değil.

![Fiyat histogramı — tüm veri (kesikli çizgi = medyan)](figures/tr-25-price-hist.png)

![Kasa tipine göre medyan fiyat](figures/tr-01-body-median.png)

## 11. Yeniden üretilebilirlik

- seed: `42` · satır sırası: `ORDER BY ad_id` · LightGBM deterministik: `True` · CatBoost cihazı: `CPU` · n_jobs: `16`

Bu raporu yeniden üretmek: `python clean/car_price_report/build_report.py`. Verinin kendisini yeniden üretmek: `python clean/build_site_data.py`.
