# İkinci El Araç Piyasası Analizi — Karar Notu

**Kime:** fiyatlama ekibi ve galeri. **Karar:** model, fiyat önerisi aracında birincil referans olarak kullanılabilir; ucuz (₺1.15M altı), emsalsiz ve 18 yaş üstü araçlarda tek başına kullanılmamalı. **Kazanç:** araç başına ~₺81K daha az fiyatlama hatası. **Sınır:** ilan fiyatını tahmin eder, satış fiyatını değil.

## Ne kadar değerinde?

**Emsal medyanı** — *aynı model, aynı yılın ortadaki fiyatı* — ortalama **₺191K** yanılıyor; model **₺110K** — **%42 daha iyi**, araç başına **₺81K**. 100 araçlık bir stokta bu, yaklaşık **₺8M**'lik fiyatlama hatası farkı demek.

Farkı kapatan, model ve yılın ötesi: kilometre, hasar, motor.

![Ortalama hata: emsal medyanı vs model](figures/tr-00-base-vs-model.png)

**Emsal yoksa taban çöküyor** — en alt basamakta ortalama hata, model+yıl basamağının **6.1 katı**. Model de emsalsiz araçta zorlanıyor (aşağıda):

| taban basamağı | ilan | pay | ortalama hata |
|---|---:|---:|---:|
| model+yıl | 29.236 | %97.49 | ₺179K |
| model | 596 | %1.99 | ₺559K |
| global | 156 | %0.52 | ₺1.10M |

## Piyasa fiyatı nasıl kuruyor

Her kalemin fiyatı ne kadar oynattığı — **diğer her şey sabitken**:

| kalem | fiyat |
|---|---:|
| yaş (yıl başına) | -%7.1 |
| kilometre (100 bin km başına) | -%14.6 |
| ağır hasar kaydı | -%11.4 |
| değişen panel (her biri) | -%3.1 |
| boyalı panel (her biri) | -%1.1 |
| +100 hp motor gücü | +%21.3 |

Yaş ve kilometre ayrı ama birbirine bağlı iki eksen. Düşük-km yaşlı araç ikisinin ayrıştığı yer: yaş cezasını yemiş ama km cezasını yememiş, yani sistematik olarak ucuz kalıyor.

![Yaşa göre fiyat (medyan + ort.)](figures/tr-05-age-price.png)

![Kilometreye göre fiyat (medyan + ort.)](figures/tr-06-km-price.png)

**Markadan hareket çıkmaz.** Seri+modelin üzerine markayı eklemek ortalama hatayı hiç oynatmıyor — marka zaten modelin içinde.

![Medyan fiyat: BMW vs Audi](figures/tr-07-brand.png)

## Sayıya nerede güvenme

Model ucuz araçlarda zorlanıyor — hata fiyat çeyreğine göre belirgin değişiyor.

![Fiyat çeyreğine göre medyan hata (%)](figures/tr-10-quartile-error.png)

**Büyük sapmalar (±%20 üstü) en çok emsali olmayan ilanlarda.** Aynı model ve yıldan başka ilan yoksa bu oran %19.2, 100+ emsal varsa %2.8. Üst/spor segment (%20.6) ve 18 yaş üstü araçlar (%11.6) da riskli; genel oran %4.0.

### Neden tek sayı değil aralık

İlan fiyatında iki yönlü hata da para kaybettirir: **fazla tahmin alıcıya patlar** — pahalıya alınmış araç; **düşük tahmin satıcıya** — ucuza gitmiş araç. Tek sayı ne kadar emin olunduğunu saklar; aralık bunu söyler ve kullanıcıyı belirsizliğin büyük olduğu yerde uyarır.

Bu yüzden çıktı tek sayı değil, **%90 aralık**. Ama aralık ucuz araçlarda tutmuyor: en ucuz çeyrekte gerçek kapsama **%81.6**, hedefin altında.

![%90 aralık kaç ilanda tuttu (hedef %90)](figures/tr-12-coverage.png)

**Ne yapmalı**

- Ucuz araçlarda aralığı genişlet — tek sayıya güvenme.
- Nadir ve uç araçları elle fiyatla; model orada saçılıyor.
- Metninde dönüşüm, motor değişimi ya da modifiye geçen ilanı otomatik fiyatlama, elle incele; bu bilgi formda yok ve en büyük hataların kaynağı.
- Takvimle değil, **kaymayı izleyerek** yenile: canlıda fiyat dağılımını izleyen bir servis kur, eşik aşılınca yeniden eğit. Bugün kayma küçük; ama piyasa seviyesi 4 dönemde +%2.0 kaydı ve model zamanı görmüyor.
- **Fiyat rejimini değiştiren gelişmeleri takip et** (vergi/ÖTV düzenlemesi, teşvik, ani piyasa hareketi gibi) — eğitim planı bunlara göre yapılmalı. Eski dönemleri atma: veri biriktikçe hata düşüyor.

![Daha çok veri, daha az hata — tek dönem vs biriken dönemler](figures/tr-15-backtest.png)

## Bu model neyi vermez

- **Satış fiyatını.** İlan fiyatını tahmin eder; satış fiyatı pazarlıkla bunun altına iner.
- **Nedenselliği.** Bunlar kontrollü ilişkiler; "boya yaptır, fiyat düşer" demez.
- **Belirli bir hasarlının değerini.** Model hasarı panel bazında görüyor (boyalı · değişen · ağır hasar kaydı) ama **şiddetini** görmüyor: çizik de pert de aynı bayrağa düşüyor.
- **Donanım ve modifiyeyi.** Full donanımlı araç, modelin gözünde aynı aracın donanımsız hâliyle aynı.
- **BMW ve Audi dışını.** Kapsam bu iki marka; premium-Alman segmentine genellenebilir, genel pazara değil.

**Ölçek:** 29.988 ilan, 4 tarama dönemi. **Veri:** 2026-01-18 – 2026-06-27. Medyan ilan fiyatı ₺1.54M.
