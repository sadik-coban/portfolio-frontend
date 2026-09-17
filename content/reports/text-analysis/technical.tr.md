# Metin Analizi — Teknik Rapor

> Üretilmiş dosya — kaynak `metrics/*.json` + `data/langextract/extraction_results.jsonl`, üreteç `clean/text_analysis/build_text_report.py`.

Karar özeti: [business.tr.md](business.tr.md)

## 1. Metin fiyat doğruluğuna ne katıyor

Bu, iddia değil **ölçüm**: yapısal-yalnız R² **0.9645**, metin eklenince **0.966** → ΔR² **0.0015**. Aynı OOF protokolü. Metnin fiyat tahminine katkısı pratikte sıfırdır; analizin geri kalanı bu kabulün üzerine kurulu.

## 2. Çelişki bayrağı nasıl kuruldu

Naif eşleşme 1.220 ilan veriyordu. Bayrak iddia-türünü sayaç-türüyle eşler (değişensiz↔değişen, boyasız↔boya) ve şunları **dışlar**: kapsamlı yapısal iddia (şase/motor hatasız), "X hariç" beyanı, yalnız lokal rötuş. 1.057 masum ayıklandı → gerçek çelişki **163**.

### Şiddet

| sınıf | ilan | pay |
|---|---:|---:|
| hafif | 71 | %43.6 |
| orta | 84 | %51.5 |
| ağır | 8 | %4.9 |

| ölçü | değer |
|---|---:|
| boyalı panel — medyan / ortalama | 2 / 2.17 |
| değişen panel — medyan / ortalama | 0 / 0.42 |
| hiç değişen paneli olmayan | %68.7 |
| pert / ağır hasar kaydı | %3.1 |

Sınıf tanımı: `ağır=pert/ağır-hasar VEYA 3+ değişen panel · orta=1-2 değişen ya da 3+ boya · hafif=≤2 boya & 0 değişen`

![Kaç panel boyalı vs değişen](figures/tr-02-panel-dist.png)

### Örnekler — metin "temiz", formda kayıt var

| model | fiyat | boyalı / değişen | dedektörün bulduğu "temiz" ifadeleri |
|---|---:|---:|---|
| 318i Pure | ₺1.725.000 | 1 / 0 | `hatasız`, `boyasız`, `tramersiz` |
| 520i M Sport | ₺4.149.000 | 1 / 0 | `hatasız`, `boyasız`, `tramersiz` |
| A3 Sportback 1.6 TDI Attraction | ₺1.260.000 | 2 / 0 | `hatasız` |
| A6 Sedan 45 TFSI Quattro Design | ₺4.290.000 | 3 / 0 | `hatasız` |
| 320i ED Luxury Line Plus | ₺1.550.000 | 0 / 2 | `hatasız`, `boyasız` |
| A4 Sedan 2.0 TDI | ₺950.000 | 5 / 0 | `değişensiz`, `boyasız` |
| A6 Sedan 2.0 TDI | ₺1.850.000 | 0 / 1 | `hatasız` |
| 520i M Sport | ₺1.710.000 | 3 / 1 | `orijinal` |

### Örnekler — ters yön: metinde hasar var, form boş

| model | fiyat | boyalı / değişen | dedektörün bulduğu hasar ifadeleri |
|---|---:|---:|---|
| 320d Standart | ₺1.199.000 | 0 / 0 | `tramer`, `lokal boya`, `değişen` |
| 520d Standart | ₺700.000 | 0 / 0 | `hasar kaydı` |
| M5 | ₺3.500.000 | 0 / 0 | `tramer` |
| 320i ED Luxury Line | ₺1.574.900 | 0 / 0 | `hasar kaydı` |
| 520d Standart | ₺795.000 | 0 / 0 | `tramer` |
| A3 Sedan 1.6 TDI Ambition | ₺1.375.000 | 0 / 0 | `tramer`, `değişen`, `lokal boya` |
| 318i Edition Luxury Line | ₺1.495.000 | 0 / 0 | `değişen` |
| 316i Modern Line | ₺1.159.999 | 0 / 0 | `tramer` |

Ters yön toplamda **3.964 ilan**: metin hasar anlatıyor, sayaç boş — yapısal alanın eksik olduğu yer. Tablolarda ham metin yok, yalnız dedektörün eşleştirdiği kelimeler; ilan kimliği (`ad_id`) kaynakta olduğu hâlde bilerek yazılmadı.

## 3. LangExtract ile kapsam doğrulama

İlan metinleri bir kez **offline** olarak Google **LangExtract** ile yapılandırılmış çıkarıma sokuldu (çıkarım modeli Gemini 3.1 Flash Lite): **13.904 ilan · 41.866 çıkarım** (ilan başına ort. 3.0), bunların 13.867 tanesi analiz kümesinde → kapsama **%46.2**. `match_exact` hizalama oranı %95.9.

| sınıf | çıkarım | nitelikler | en sık örnek: girdi → çıktı |
|---|---:|---|---|
| Hasar | 19.800 | parça · durum | "sağ ön çamurluk değişen" → durum: değişmiş · parça: sağ ön çamurluk (90×) |
| Bakım | 14.086 | parça · durum | "lastikleri yeni durumda" → durum: sıfır/yeni · parça: lastik (197×) |
| Modifiye | 4.433 | parça · durum | "m direksiyon" → durum: sonradan takılmış · parça: direksiyon (40×) |
| Beygir | 3.547 | güç | "170 hp" → güç: 170 (382×) |

Örnek = sınıf başına **en sık** görülen (ifade, nitelik) çifti, dosyadan hesaplanır; en az 10 kez görülmediyse yazılmaz. Böylece tek bir ilana ait ifade rapora girmez.

### Durum sözlüğü (Hasar sınıfı, en sık 5)

| durum | çıkarım | Hasar durumlarındaki pay |
|---|---:|---:|
| boyalı | 5.141 | %26.0 |
| tramer kayıtlı | 3.856 | %19.5 |
| lokal boyalı | 3.057 | %15.4 |
| değişmiş | 2.705 | %13.7 |
| hasar kayıtlı | 1.550 | %7.8 |

**Rolü.** LLM'in durum sözlüğü regex dedektörlerine damıtıldı (`steps/build_text_insights.py` hasar sözlüğü + modifiye dedektörü). Üretimde koşan **regex**'tir; LLM fiyat özniteliği değildir ve pipeline'da çalışmaz. Kapsam 13.867/29.988 = %46.2 olduğu için LLM etiketleri **kısmi** yer-gerçeğidir: regex'e karşı ölçülecek precision "regex hatası" değil, **uyum oranıdır**. Sözlük LLM'den damıtıldığı için bu ölçüm kısmen döngüseldir (uyumu şişirir) — bağımsız doğruluk kanıtı değil, regresyon testi olarak okunmalı. O test (`obselete/clean-oncesi/code/llm_coverage_test.py`) temiz zincirin parçası değil ve bu raporda koşulmadı.

## 4. "Temiz" beyanının fiyatı

Zincir aynı iddia için birden çok sayı üretir; aşağıda hepsi hangi modelden geldiğiyle birlikte. Her basamak bir öncekine kontrol ekler; primin basamaklar boyunca nasıl kaydığı karıştırıcının (confounding) kendisidir.

### Prim merdiveni — çelişkili "temiz" beyanı (163 ilan)

| basamak | kontroller | prim | %95 GA | p | bayraklı n |
|---|---|---:|---:|---:|---:|
| ham (kontrolsüz) | — | -%12.8 | — | — | 163 |
| A · özellikler | yaş · log km · HP · segment · kasa · yakıt · çekiş | +%0.8 | -%1.5 … +%3.1 | 0.518 | 161 |
| B · + hasar | A + boyalı · değişen · lokal boya · ağır hasar sayaçları | +%1.1 | -%1.1 … +%3.2 | 0.332 | 161 |
| C · + seri | B + seri | +%1.4 | -%0.7 … +%3.5 | 0.186 | 161 |
| LightGBM OOF artık | bayraksız model (model/seri kategorik), bayraklıların ort. artığı · 400× bootstrap GA | +%1.4 | +%0.1 … +%2.9 | — | 163 |

### Prim merdiveni — başlıkta "temiz", formda hasar (2.856 ilan)

| basamak | kontroller | prim | %95 GA | p | bayraklı n |
|---|---|---:|---:|---:|---:|
| ham (kontrolsüz) | — | -%9.4 | — | — | 2.856 |
| A · özellikler | yaş · log km · HP · segment · kasa · yakıt · çekiş | +%0.9 | +%0.3 … +%1.5 | 0.001 | 2.847 |
| B · + hasar | A + boyalı · değişen · lokal boya · ağır hasar sayaçları | -%0.1 | -%0.7 … +%0.4 | 0.677 | 2.847 |
| C · + seri | B + seri | %0.0 | -%0.5 … +%0.5 | 0.925 | 2.847 |
| LightGBM OOF artık | bayraksız model (model/seri kategorik), bayraklıların ort. artığı · 400× bootstrap GA | -%0.2 | -%0.5 … +%0.1 | — | 2.856 |

**Hangi sayı nereden.** Karar notundaki +%1.4 = birinci merdivenin **C** basamağı (p 0.19). LightGBM kolu aynı büyüklüğü veriyor ama GA'sı +%0.1 … +%2.9 — sıfırı dışlıyor, sınırda anlamlı. §5'teki katsayı tablosundaki +%1.9 (n 161) ise **üçüncü bir model**: tüm metin sinyalleri aynı regresyonda eşzamanlı; kontrol seti ve eş-değişkenler farklı olduğu için merdivenle birebir aynı çıkmaz. İkinci popülasyonda prim yalnız A basamağında görünür; hasar sayaçları girince kaybolur → başlıktaki "temiz" sözcüğünün kendi primi yok, fark hasar kompozisyonundan.

### Hasar durumu — 3 grup (tüm ilanlar)

| metinde | ilan | medyan fiyat | kontrollü fark |
|---|---:|---:|---:|
| hasar beyanı | 18.745 | ₺1.43M | — |
| temiz beyanı | 6.004 | ₺2.10M | +%2.7 |
| hasardan hiç bahsetmiyor (referans) | 5.239 | ₺1.50M | 0 |

**Betimleyici.** Medyan fiyatları yan yana okumak yanıltır: temiz beyanlı araçlar zaten daha genç, düşük km'li ve üst segmentte. Kontrollü fark (yaş · log km · HP · hasar sayaçları · segment · marka, HC3) +%2.7 — bu **6.004 temiz beyanlı ilanın tamamı** için, hasardan bahsetmeyenlere göre; yukarıdaki 163 çelişkili ilanın primi değildir.

## 5. Kontrollü katsayılar ve donanım

Tüm metin sinyalleri **tek** hedonik log-OLS'te eşzamanlı, HC3 robust SE ile. n **29.562**, R² **0.9308**. Kontroller: yaş · log_km · hp · segment · kasa · yakıt · çekiş · hasar sayaçları · series (HC3 robust SE)

| sinyal | kontrollü | %95 GA (HC3) | %95 GA (bootstrap 1000×) | p | ham | n |
|---|---:|---:|---:|---:|---:|---:|
| Premium ses sistemi | +%5.5 | +%4.8 … +%6.1 | +%4.8 … +%6.1 | <0.001 | +%83.5 | 3.055 |
| Modifiye süspansiyon | +%5.1 | +%3.7 … +%6.5 | +%3.7 … +%6.5 | <0.001 | -%9.2 | 418 |
| Modifiye egzoz | +%3.5 | +%1.4 … +%5.6 | +%1.5 … +%5.5 | <0.001 | -%13.0 | 285 |
| Servis kayıtlı | +%3.1 | +%1.3 … +%4.9 | +%1.4 … +%5.1 | <0.001 | +%18.4 | 226 |
| Yetkili servis | +%2.0 | +%1.4 … +%2.5 | +%1.4 … +%2.5 | <0.001 | +%53.2 | 3.248 |
| Modifiye motor / yazılım | +%1.9 | -%0.5 … +%4.4 | -%0.4 … +%4.4 | 0.118 | -%21.0 | 211 |
| Çelişkili 'temiz' beyanı (satıcının formu hasar gösteriyor) | +%1.9 | -%0.2 … +%3.9 | -%0.1 … +%3.9 | 0.078 | -%12.9 | 161 |
| Navigasyon | +%1.5 | +%1.0 … +%1.9 | +%1.0 … +%2.0 | <0.001 | +%51.3 | 6.558 |
| Isıtmalı koltuk | +%1.5 | +%1.0 … +%2.0 | +%1.0 … +%2.0 | <0.001 | +%44.4 | 6.866 |
| Panoramik tavan | +%0.9 | +%0.5 … +%1.3 | +%0.5 … +%1.3 | <0.001 | +%38.0 | 10.749 |
| Sürüş asistanı | +%0.8 | +%0.3 … +%1.3 | +%0.2 … +%1.3 | 0.003 | +%91.2 | 5.570 |
| Modifiye jant / kaporta | +%0.4 | -%1.2 … +%2.1 | -%1.3 … +%2.1 | 0.615 | -%10.8 | 226 |
| Garanti | +%0.1 | -%0.4 … +%0.6 | -%0.4 … +%0.6 | 0.767 | +%13.5 | 2.878 |
| Deri koltuk | -%0.4 | -%0.9 … +%0.1 | -%0.9 … +%0.1 | 0.105 | +%22.3 | 4.752 |

> **Kontrollü ≠ ham.** Ham fark büyük ölçüde kompozisyondan gelir; her fiyat iddiası araç özellikleri sabitlenerek verilir. Bunlar **ilişki**, nedensellik değil. HC3 ve bootstrap aralıkları neredeyse aynı → tahminler kararlı.

### Donanım kapsaması

Donanım alanları yapısal şemada yok → metin tek kaynak. 15 terim, olumsuzluk-güvenli eşleşme ("sunroof yok" pozitif sayılmaz), Türkçe `ı/i` toleranslı.

![Donanım anılma oranı (metin tek kaynak)](figures/tr-04-equipment.png)

## 6. Triyaj — nerede şaşıyor, hangi ilanlar incelenmeli

### Residual sinyalleri

Modelin en çok *düşük* tahmin ettiği %5'lik dilimde (1.500 ilan) hangi metin sinyalleri beklenenden fazla görünüyor? Lift = gözlenen / beklenen.

![Under-predict sinyalleri — en yüksek %5'te yoğunlaşma (lift)](figures/tr-06-residual-signals.png)

> Kaynakta 1 sinyal daha var ama **robust değil** — rapora alınmadı. Sağlamlık testini geçmeyen sinyal triyaj listesine giremez.

### Anomali kuyruğu

| sinyal / kesişim | ilan |
|---|---:|
| pozitif artık ucu (fiyat beklenenin çok üstünde) | 1.500 |
| dönüşüm anlatan metin | 632 |
| HP çelişkisi (metin HP ≫ alan HP) | 73 |
| artık ∧ metin | 48 |
| artık ∧ HP | 14 |
| **üçlü** (üçü birden) | **5** |

Her sinyal tek başına gürültülü; kesişim büyüdükçe aday güçlenir. Sayılar her koşumda hesaplanır.

### Anomali adayları

| model | yaş | alan HP | metin HP | fiyat | model tahmini | artık |
|---|---:|---:|---:|---:|---:|---:|
| 750i Long | 17 | 413 | 600 | ₺5.300.000 | ₺2.506.656 | +%52.7 |
| M3 | 20 | 343 | 750 | ₺2.900.000 | ₺1.484.399 | +%48.8 |
| 640i | 15 | 320 | 650 | ₺5.600.000 | ₺3.299.846 | +%41.1 |
| M3 | 14 | 420 | 630 | ₺3.975.000 | ₺3.345.872 | +%15.8 |
| 520d M Sport | 19 | 188 | 350 | ₺1.125.000 | ₺953.738 | +%15.2 |

> **İnceleme adayı, kanıt değil.** Metindeki yüksek HP bir motor dönüşümünü de, satıcının yazım hatasını da gösterebilir; karar insan doğrulamasıyla verilir, otomatik değil.

### Alan çelişki örnekleri

| model | alan | metin diyor | yapısal alan |
|---|---|---|---|
| A3 Sportback 1.6 TDI Sport Line | yakıt | Dizel | Benzin |
| 520d M Sport | vites | Düz | Otomatik |
| 420i Gran Coupe Edition M Sport | çekiş | 4WD | RWD |
| A3 Sedan 35 TFSI Dynamic | kasa | Sedan | Hatchback |
| 420d M Sport | motor hacmi | 3.0L | 1995 |
| 116i M Sport | yıl | 2017 | 2012 |
| 335i Standart | hp | 600 | 306 |
| 116i M Sport | model | m6 | 116i M Sport |

İnceleme kuyruğunda 48 satır var (alan başına eşit örnek); tabloda alan başına biri. Toplam çelişki sayıları: model 795 · yıl 253 · vites 221 · yakıt 86 · hp 73 · çekiş 53 · motor hacmi 22 · kasa 10. km bilerek dışarıda: metindeki km servis/satın alma/politika km'sinden desenle ayrılamıyor. Çoğu satıcı hatası ya da swap/dönüşüm işareti — kanıt değil.

## 7. Satıcı, başlık ve ilan dili

### Satıcı üslubu

| satıcı | ilan | başlık BÜYÜK harf | emoji / ilan | ünlem / ilan | açıklama uzunluğu (medyan karakter) | telefon bahsi |
|---|---:|---:|---:|---:|---:|---:|
| Galeriden | 20.094 | %90.8 | 0.22 | 0.50 | 784 | %22.9 |
| Sahibinden | 9.727 | %30.5 | 0.21 | 0.10 | 528 | %1.4 |
| Yetkili Bayiden | 167 | %91.2 | 0.00 | 0.10 | 911 | %38.9 |

Betimleyici — satıcı tipine göre (`gb_seller_type`). Nedensel iddia yok.

### İlan başlığı madenciliği

| başlık neyle açılıyor (kanca) | ilan payı |
|---|---:|
| spec(yıl/km/motor) | %78.7 |
| donanım | %40.8 |
| hasarsız-iddia | %30.6 |
| durum/övgü | %8.0 |
| aciliyet/promo | %1.0 |

Bir başlık birden çok kanca taşıyabilir (paylar toplamı %100'ü aşar). Ortalama **8.5 kelime**. Başlıkta "temiz" ama sayaçta hasar: **2.856 ilan**. Başlıktaki yıl ≠ alan yılı: **530 ilan**. Başlığında temiz sözcüğü geçen **tüm** ilanların kontrollü farkı (yaş · log km · HP · hasar sayaçları · segment · marka, HC3) **+%2.1** — hasar şartı yok, geçmeyenlere göre; §4'teki çelişkili başlık popülasyonunun primi değildir.

### İlan dili temaları (NMF) — k=3

| tema | ilan | pay | baskın satıcı | en ağırlıklı kelimeler |
|---:|---:|---:|---|---|
| 1 | 10.409 | %34.7 | Galeriden (%83.0) | elektrikli · sensörü · sistemi · koltuklar · led · koltuk · direksiyon · deri |
| 2 | 2.893 | %9.6 | Sahibinden (%97.9) | oldukça · orijinaldir · herhangi · aracımda · uzun · satıyorum · süre · uzun süre |
| 3 | 16.519 | %55.1 | Galeriden (%68.1) | kredi · parça · boya · vardır · yeni · bakımları · hasar · motor |

Temalar ilanın **üslubu** — fiyat arketipi değil. Satıcı tipiyle Cramér's V **0.339**: orta düzey ilişki; temaların bir kısmı satıcı tipini yeniden türetiyor, yeni fiyat bilgisi değil. Tema başına fiyat bilerek verilmedi (metin fiyata artımsal bilgi katmıyor, §1). Boş metinli 167 ilan temalara girmedi.

## 8. Gizlilik ve kapsam dışı bırakılanlar

- **Ham ilan metni hiç girmez.** Örnek tablolarında yalnız dedektörün eşleştirdiği kelimeler; LangExtract örneğinde yalnız sınıf başına en az 10 kez görülmüş jenerik ifade.
- **`ad_id` hiç yazılmaz.** Kaynak JSON'da var; üreteç düşürür.
- **İlan düzeyindeki satırlar bilinçli olarak yayımlanır** (model · fiyat · sayaçlar · HP) — eski sayfayla aynı sütunlar. Kimlik ve metin olmadan bir satır tek başına ilanı göstermez; ama nadir bir model + tam fiyat birleşimi aramayla bulunabilir. Bu risk kabul edilmiş bir karar, yok sayılmış değil.
- `residual_keywords` bloğu **kullanılmaz** — inceleme sonucu reddedildi (donanım/renk artefaktı).
- Robust olmayan residual sinyalleri dışarıda.

