# Car Price — Karar Notu

> Üretilmiş dosya — kaynak `clean/data/site_data.json`, üreteç `clean/car_price_report/build_report.py`. Her sayı JSON'dan okunur.

Teknik dayanak: [technical.tr.md](technical.tr.md)

## Ne kadar değerinde?

Galerinin refleksi — *aynı model, aynı yıl, medyana bak* — ortalama **₺191K** yanılıyor. Model **₺110K** yanılıyor: **%42 daha iyi**, araç başına **₺81K**.

Kapattığı şey model+yılın ötesi: kilometre, hasar, motor.

![Ortalama hata: galeri refleksi vs model](figures/tr-00-base-vs-model.png)

**Emsal yoksa taban çöküyor.** Model her yerde aynı kalıyor:

| taban basamağı | ilan | pay | ortalama hata |
|---|---:|---:|---:|
| model+yıl | 29.236 | %97.49 | ₺179K |
| model | 596 | %1.99 | ₺559K |
| global | 156 | %0.52 | ₺1.10M |

## Piyasa fiyatı nasıl kuruyor

Yaş yılda **%7.1**, kilometre her 100 bin km'de **%14.6** değer kaybettiriyor — ayrı ama korelasyonlu iki eksen. Düşük-km yaşlı araç ikisinin ayrıştığı yer: yaş cezasını yemiş ama km cezasını yememiş, yani sistematik olarak ucuz kalıyor.

![Yaşa göre fiyat (medyan + ort.)](figures/tr-05-age-price.png)

![Kilometreye göre fiyat (medyan + ort.)](figures/tr-06-km-price.png)

Denetimsiz kümeleme piyasayı 3 profile ayırıyor (k=3 yorumlanabilirlik için sabit seçildi; veride belirgin doğal küme yok — bkz. teknik §8):

| küme | ilan | medyan | yaş | km | motor (hp) | ağır hasar |
|---|---:|---:|---:|---:|---:|---:|
| Yaşlı & yüksek-km ekonomik · ağır hasar %5 | 9.046 | ₺1.32M | 14 | 253k | 177 | %5 |
| Genç & temiz premium | 15.976 | ₺1.95M | 9 | 128k | 150 | %2 |
| Yaşlı & yüksek-km ekonomik · ağır hasar %13 | 4.966 | ₺1.06M | 14 | 247k | 150 | %13 |

> Not: üretici iki kümeye aynı adı vermiş; ayıran eksen **ağır hasar oranı** (yukarıdaki son sütun). Adlar otomatik üretiliyor, elle düzeltilmedi.

![Segmente göre medyan fiyat](figures/tr-02-segment-median.png)

**Markadan hareket çıkmaz.** Seri+modelin üzerine markayı eklemek ortalama hatayı hiç oynatmıyor (MAPE farkı 0.00 puan) — marka zaten modelin içinde.

![Medyan fiyat: BMW vs Audi](figures/tr-07-brand.png)

## Sayıya nerede güvenme

Model ucuz araçlarda zorlanıyor — hata fiyat çeyreğine göre belirgin değişiyor.

![Fiyat çeyreğine göre medyan hata (%)](figures/tr-10-quartile-error.png)

### Neden tek sayı değil aralık

İlan fiyatında iki yönlü hata da para kaybettirir: **fazla tahmin alıcıya**, pahalı alınan araç olarak; **düşük tahmin satıcıya**, ucuza giden araç olarak patlar. Tek sayı ne kadar emin olunduğunu saklar; aralık bunu söyler ve kullanıcıyı belirsizliğin büyük olduğu yerde uyarır.

Bu yüzden çıktı tek sayı değil, **%90 aralık**. Ama aralık ucuz araçlarda tutmuyor: en ucuz çeyrekte gerçek kapsama **%81.6**, hedefin altında.

![Conformal kapsama % (hedef %90)](figures/tr-12-coverage.png)

**Ne yapmalı**

- Ucuz araçlarda aralığı genişlet — tek sayıya güvenme.
- Nadir ve uç araçları elle fiyatla; model orada saçılıyor.
- Aylık yeniden eğit — piyasa seviyesi kaydı (+%5.3), model zamansız.

![OOF MAPE — dönem başına vs kümülatif](figures/tr-15-backtest.png)

## Bu model neyi vermez

- **Satış fiyatını.** İlan fiyatını tahmin eder; pazarlık payı hedefin içinde kalır.
- **Nedenselliği.** Bunlar kontrollü ilişkiler; "boya yaptır, fiyat düşer" demez.
- **Belirli bir hasarlının değerini.** "Hasarlı" çizikten pert'e kadar değişir ama hepsi modelin ayıramadığı tek bir düşük kümede fiyatlanır.
- **Donanım ve modifiyeyi.** Full-donanımlı araç modele, aynı spec'in baz hâliyle aynı görünür.
- **BMW ve Audi dışını.** Kapsam bu iki marka; premium-Alman segmentine genellenebilir, genel pazara değil.

**Ölçek:** 29.988 ilan, 4 dönem (2026-01-18 – 2026-06-27). Medyan ilan fiyatı ₺1.54M.
