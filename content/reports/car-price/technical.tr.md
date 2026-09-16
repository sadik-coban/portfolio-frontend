# Car Price — Teknik Rapor

> Üretilmiş dosya — kaynak `clean/data/site_data.json`, üreteç `clean/car_price_report/build_report.py`. Her sayı JSON'dan okunur.

Karar özeti: [business.tr.md](business.tr.md)

## 1. Veri, dedup ve sızıntı

**45.159 snapshot → 29.988 ilan.** Aradaki 15.171 satır aynı ilanın tekrar taranması — veri değil, tarama artığı. `ad_id` başına en son snapshot alındı.

Medyan ilan fiyatı ₺1.54M, ₺0.84M–₺3.42M arası (P10–P90).

**Sızıntı kontrolü.** Dedup `ad_id` üzerinden ve CV'den ÖNCE yapıldı. Değerlendirme 5-fold out-of-fold: her ilan tam olarak bir kez, kendisini görmemiş bir modelle tahmin edildi.

`ad_id`'nin göremediği risk ayrı kontrol edildi — **içerik-bazlı duplikasyon**: ayırt edici tüm alanları aynı olan 137 satır (%0.46), en gevşek tanımla 209 (%0.7). Fold'lar arası çakışabilecek gerçek tekrar %1'in altında.

## 2. Eksiklik rastgele değil

30 kolon %2'nin üzerinde eksik ve bir kısmı **birlikte** düşüyor; birlikte-eksiklik korelasyonu **1.0**. Bu "eksik veri" değil, katalog eşleşmesinin çöktüğü ilanlar: standart modeller eşleşir, niş varyantlar eşleşmez, tüm spec birden boşalır. Sistematik olduğu için güvenilir imputasyon yok → bu kolonlar çıkarıldı.

![Eksiklik oranı (%) — aynı oran = birlikte eksik blok](figures/tr-16-missing.png)

## 3. Fazlalık ve bağıntı kontrolleri

Cramér's V ilişkinin gücünü (simetrik), Theil's U yönünü (asimetrik) verir. Asimetri bulgunun kendisi: `model` diğerlerini neredeyse tam belirliyor ama tersi değil — yani `seri`, `model`in kabalaştırılmış hâli, bağımsız bilgi değil.

![Theil's U (yönlü bağımlılık)](figures/tr-17-theils-u.png)

![Cramér's V (simetrik ilişki gücü)](figures/tr-18-cramers-v.png)

![Her seri tek bir segmente düşüyor — medyan fiyat (₺M)](figures/tr-19-series-segment.png)

Sayısal öznitelikler arası korelasyon — yukarıdaki kategorik bağıntının sayısal karşılığı. |r|>0.5 çiftler çoklu-bağlantı için işaretlendi (VIF ile de kontrol edildi).

![Pearson](figures/tr-20-pearson.png)

![Spearman](figures/tr-21-spearman.png)

## 4. Hedonik model — kontrollü etkiler

Hedonik regresyon her sürücünün *kontrollü* (diğer her şey sabitken) fiyat etkisini verir — R² **0.9309**, n **29.554**. Katsayılar bootstrap ile güven aralıklı; 10 terimin hepsinin %95 GA'sı sıfırı dışlıyor → her sürücü güvenilir şekilde anlamlı.

![Bootstrap katsayıları (nokta + %95 GA)](figures/tr-03-bootstrap-ci.png)

LOFO ikinci ve bağımsız bir yöntem: her özniteliği çıkarıp CV hatasının ne kadar büyüdüğüne bakar. Aynı sıralamayı vermesi bulgunun kendisi.

![LOFO — öznitelik çıkınca ΔRMSE (çakışmayan gruplar)](figures/tr-04-lofo-flat.png)

> **Not — düz LOFO.** Ham `methodology.lofo` hem tekil hem grup çıkarmaları bir arada taşıyor; ikisini aynı eksende basmak çift sayım olur (`DAMAGE_COLS` kendi 13 üyesiyle yarışır). Yukarıdaki grafik **çakışmayan** 5 gruba indirgenmiştir ve 25 özniteliğin 19'unu kapsar. Kalan 6 kategorik öznitelik (`brand`, `kb_body_type`, `kb_drivetrain`, `segment`, `kb_transmission`, `kb_fuel`) LOFO'da **hiç ölçülmemiştir** — üretici yalnız sayısal ve metin özniteliklerini geziyor. "km ve yaş baskın" sonucu bu sınır içinde okunmalıdır.

## 5. Model karşılaştırma ve gürültü tabanı

Kazanan LightGBM (TF-IDF+SVD) — MAPE **%6.5**, R² **0.9744**, MAE **₺110K**. Hedef `log1p(price)`, 25 öznitelik. Model+yıl medyan tabanına göre %42 daha iyi.

**Gürültü tabanı.** Aynı spec'teki araçlar (aynı model · yıl · km · hp · kasa) birbirinden **₺77K** aralıkla ilan ediliyor — 5.767 satır, 2.577 grup. Bu bir taban: aynı arabayı satıcılar farklı fiyatlıyor ve hiçbir model bunun altına inemez. Model ₺110K'de, yani tabanın **1.42 katında**; geriye kalan tüm pay ₺33K. Hiperparametre araması tipik olarak bunun ~₺5K'sini alır, o yüzden yapılmadı.

## 6. Kalibrasyon, artıklar ve zayıflık

OOF (sızıntısız) tahminler gerçek fiyata karşı — R² **0.9744**. Artık% sıfır etrafında (ort. %-0.48, std %9.31) → sistematik yanlılık yok.

![Tahmin vs Gerçek (R² 0.974)](figures/tr-08-pred-vs-true.png)

![Artık% vs Tahmin](figures/tr-09-residual.png)

![Model ilan-adedi vs medyan hata (log eksen)](figures/tr-11-n-vs-error.png)

## 7. Dağılım kayması ve zamansal backtest

İki kanıt aynı kararı veriyor. Dağılım kayması: dönemler arası eğriler neredeyse çakışık. Zamansal backtest: eski dönemde eğit, sonraki dönemin yalnızca YENİ ilanlarında test et (sızıntısız). Sonuç: piyasa SEVİYESİ +%5.3 kaydı ama ŞEKİL sabit → aylık yeniden eğitim yeter.

![Fiyat dağılımı — dönemlere göre](figures/tr-13-drift-hist.png)

![Log-fiyat yoğunluğu — dönemlere göre](figures/tr-14-drift-kde.png)

## 8. Segmentasyon — KMeans + PCA

k=3 silhouette ile seçildi, PCA saçılımıyla doğrulandı. Hasar sinyalinin hedonik model, PCA ve KMeans'te bağımsızca çıkması bir sağlamlık teşhisi.

![k seçimi — Elbow + Silhouette](figures/tr-24-k-selection.png)

![PCA — PC1 %19.7 × PC2 %12.4](figures/tr-22-pca-scatter.png)

![PCA — PC1 %19.7 × PC3 %11.0](figures/tr-23-pca-scatter-13.png)

## 9. Hedef ve önişleme

Ham fiyat sağa çarpık (çarpıklık 1.62); log dönüşümü simetriğe yaklaştırıyor (0.28). Model `log1p(price)` üzerinde eğitildi: uç değerler kareli kayıpta tüm hata bütçesini yutuyordu. Bu bir modelleme kararı, piyasa bulgusu değil.

![Fiyat histogramı — tüm veri (kesikli çizgi = medyan)](figures/tr-25-price-hist.png)

![Kasa tipine göre medyan fiyat](figures/tr-01-body-median.png)

## 10. Yeniden üretilebilirlik

- seed: `42` · satır sırası: `ORDER BY ad_id` · LightGBM deterministik: `True` · CatBoost cihazı: `CPU` · n_jobs: `16`

Bu raporu yeniden üretmek: `python clean/car_price_report/build_report.py`. Verinin kendisini yeniden üretmek: `python clean/build_site_data.py`.
