# Araç Fiyat Analizi — Rapor Metodolojisi (tam belge)

Bu doküman, canlı araç-fiyat analiz raporunun **her bölümünü, grafiğini, notunu, KPI'ını ve gerçek veri değerini** belgeler.

- **Kaynak:** `app/_site/report/FinalReportSiteData.tsx` (render) + `public/site_data.json` (veri)
- **Kapsam:** BMW + Audi · Türkiye ikinci-el · 4 dönem (18 Oca – 27 Haz 2026) · 29.988 tekil ilan
- **Model:** LightGBM + CatBoost · hedef `log1p(price)` · 5-fold OOF (sızıntısız) · dürüst fiyat aralıkları
- **Şablon:** her bölüm → **Sekme · Gösterim · Veri · Gerçek değerler · Anlatı (rapordaki lead) · Not/Method · Metodoloji/neden**

## İçindekiler

- **Rapor künyesi & KPI'lar**
  - Rapor girişi & kapsam
  - Künye şeridi (4 kart)
  - Model-performans KPI şeridi (4 kart)
  - Hedonik KPI şeridi (4 kart — hero)
- **Piyasa içgörüleri**
  - 01 · Fiyat dağılımı
  - 02 · Değer kaybı: yaş & kilometre
  - 03 · Hedonik model — sürücü katsayıları
  - 04 · Kasa tipine göre fiyat
  - 5. Segment merdiveni
  - 6. Seri × Segment (ısı haritası)
  - 7. Marka karşılaştırması (büyük-n tuzağı, Cliff's δ)
  - 8. Segmentasyon (KMeans)
  - 9. PCA eksen anlamları
- **Model & performans**
  - Model performans KPI şeridi (özet kartlar)
  - Model karşılaştırması (LightGBM vs CatBoost)
  - Fiyat çeyreğine göre hata (quantile MAPE)
  - İlan sayısı vs hata (güvenilirlik)
  - Modelin en iyi ve en çok yanıldığı ilanlar
  - Dağılım kayması (drift)
- **Metodoloji — model kararları**
  - 01 · Öznitelik seçimi
  - 02 · Sistematik eksiklik
  - 03 · Kategorik bağıntı (Cramér's V + Theil's U)
  - 04 · G ≡ MPV teşhisi
  - 05 · LOFO — öznitelik önemi
  - 06 · Zamansal backtest
  - Öne çıkan bulgular

---

# Rapor künyesi & KPI'lar

## Rapor girişi & kapsam
**Sekme:** Tümü (üst künye — sekmelerden bağımsız, her zaman görünür) · **Gösterim:** giriş paragrafı (17px) + mono kapsam satırı (12px)
**Veri:** `meta` (n_dedup, n_raw, snapshots, n_features, brands) — {n_dedup, n_raw, snapshots[4], n_features, brands{bmw,audi}}
**Gerçek değerler:** n_dedup 29.988; n_raw 45.159; 4 dönem snapshot (2026-01-18, 2026-01-27, 2026-03-21, 2026-06-27 → aralık "18 Oca – 27 Haz"); n_features 16; BMW 17.896 · Audi 12.092
**Anlatı (rapordaki lead):** "29.988 ilan (BMW + Audi), 4 dönem snapshot, 16 değişken. Uçtan uca ikinci-el fiyat tahmini: LightGBM + CatBoost, dürüst fiyat aralıklarıyla."
**Not / Method:** Kapsam satırı — "Kapsam: BMW+Audi, Türkiye ikinci-el, 18 Oca – 27 Haz 2026. Sonuçlar bu kapsamda geçerlidir."
**Metodoloji / neden:** Rapor daha ilk cümlede kapsamını dürüstçe çerçeveliyor: yalnızca iki premium marka, Türkiye ikinci-el piyasası, belirli 4 tarihte alınmış anlık kesitler. Bu, sonuçların aşırı genellenmesini engelleyen (over-claim etmeyen) bir işveren-güveni sinyalidir. Ham 45.159 ilandan tekilleştirmeyle (dedup) 29.988'e inilmesi, veri kalitesi adımının en baştan görünür kılınmasıdır.

## Künye şeridi (4 kart)
**Sekme:** Tümü (üst künye) · **Gösterim:** 4 sütunlu kart şeridi (mono, tabular-nums; her kartta başlık + büyük değer + alt-etiket)
**Veri:** `meta` — n_dedup / n_raw / snapshots / n_features / brands
**Gerçek değerler:**
- İlan: **29.988** — alt: "45.159 ham"
- Dönem: **4** — alt: "18 Oca – 27 Haz"
- Değişken: **16** — alt: "117'den seçildi"
- Marka: **BMW · Audi** — alt: "17.896 · 12.092"
**Anlatı (rapordaki lead):** — (şeritte lead yok; kart etiketleri veri künyesidir)
**Not / Method:** — (bu şeritte ayrı Method notu yoktur)
**Metodoloji / neden:** Şerit, veri kümesinin "kimlik kartı"dır. "117'den seçildi" alt-etiketi, 117 aday kolondan yalnızca 16'sının modele alındığını — yani agresif bir öznitelik seçimi/eleme yapıldığını — tek bakışta iletir. Ham → tekil ilan farkı (45.159 → 29.988, ~%34 azalma) mükerrer ilan temizliğinin ölçeğini gösterir.

## Model-performans KPI şeridi (4 kart)
**Sekme:** Tümü (üst künye) · **Gösterim:** 4 sütunlu KPI şeridi; kazanan kart yeşil (accent) vurgulu
**Veri:** `domain.final_results.model_karsilastirma` — {catboost{MAE,MedAE,RMSE,MAPE,R2}, lightgbm{...}, kazanan, not}
**Gerçek değerler:**
- CatBoost MAPE: **%6.47** ★ (accent) — alt: "R² 0.975 · ★ kazanan"
- LightGBM MAPE: **%6.72** — alt: "R² 0.974"
- En iyi MAE: **₺110K** (min(110.060; 113.064)) — alt: "MedAE ₺75K" (min(74.961; 77.199))
- En iyi RMSE: **₺176K** (min(175.667; 179.720)) — alt: "5-fold OOF"
**Anlatı (rapordaki lead):** — (KPI şeridi; lead yok)
**Not / Method:** — (şeritte caption yok; kaynak notu Model karşılaştırması bölümünde: "Metrikler 5-fold OOF (sızıntısız). Final modeller tüm veriyle eğitildi.")
**Metodoloji / neden:** Şerit iki rakip gradyan-artırma modelini yan yana koyup kazananı (CatBoost, MAPE %6.47) görsel olarak öne çıkarır. "En iyi MAE/RMSE" kartları iki modelin en iyi değerini alarak sistemin ulaşılabilir en düşük hatasını verir. Tüm metrikler 5-fold out-of-fold (sızıntısız) olduğundan, gösterilen doğruluk iyimser-yanlı değil dürüsttür — işverene sunumda kritik.

## Hedonik KPI şeridi (4 kart — hero)
**Sekme:** Tümü (üst künye — hero) · **Gösterim:** 4 sütunlu büyük-punto (19–22px) hero şeridi; R² kartı yeşil accent
**Veri:** `domain.hedonic_reliability` (model_r2 + bootstrap terimleri; `domain.hedonic` yalnız stale yedek) — hero değerleri bootstrap-fit'ten türetilir
**Gerçek değerler:**
- Hedonik R²: **0.93** (model_r2 0.9309)
- Yaş / yıl: **%-7.1** (yaş katsayısı −0.0739 → e^β−1 = −%7.1)
- Ağır hasar: **%-11.4** (katsayı −0.121 → −%11.4)
- 100k km: **%-14.6** (km(100K) katsayısı −0.1576 → −%14.6)
**Anlatı (rapordaki lead):** — (hero şeridi; lead yok)
**Not / Method:** — (kod yorumu: tek hedonik doğruluk kaynağı olarak ayrıntılı bootstrap-fit `hedonic_reliability` tercih edilir; `domain.hedonic` bayat özet olduğundan hero KPI + değer kaybı lead'i Hedonik bölümüyle tutarlı kalsın diye)
**Metodoloji / neden:** Hero, raporun "para cümlesidir": ham korelasyon değil, *kontrollü* (diğer her şey sabitken) fiyat etkilerini gösterir. R² 0.93'lük yorumlanabilir bir hedonik model, "yaşın, hasarın, kilometrenin fiyata net katkısı nedir?" sorusuna izole cevap verir. Yüzdeler log-katsayılardan e^β−1 ile türetilerek doğru şekilde yüzdeye çevrilir — naif "β×100" kestirmesi kullanılmaz.

---

# Piyasa içgörüleri

## 01 · Fiyat dağılımı
**Sekme:** Piyasa · **Gösterim:** 3 istatistik kartı (Stat; grid 2/3 sütun) — çarpıklık(ham), çarpıklık(log, accent), medyan fiyat
**Veri:** `domain.price_dist` — {skew_raw, skew_log, median}
**Gerçek değerler:** Çarpıklık (ham) **1.62**; Çarpıklık (log) **0.28** (accent); Medyan fiyat **₺1.55M** (1.545.000)
**Anlatı (rapordaki lead):** "Fiyat sağa çarpık (çarpıklık 1.62); log dönüşümü simetriğe yaklaştırıyor (0.28). Model log-fiyat üzerinde eğitildi — bu, uç değerleri ehlileştirir."
**Not / Method:** — (bu bölümde ayrı Method notu yok)
**Metodoloji / neden:** Fiyatların sağa çarpık olması (birkaç çok pahalı araç ortalamayı yukarı çeker) doğrudan regresyon/ağaç modellerini uç değerlere karşı hassaslaştırır. log1p(price) dönüşümü çarpıklığı 1.62 → 0.28'e indirerek dağılımı simetriğe yaklaştırır; bu yüzden nihai model hedefi de `log1p(price)` seçilmiştir. Karar burada veriyle gerekçelendirilir.

## 02 · Değer kaybı: yaş & kilometre
**Sekme:** Piyasa · **Gösterim:** yan yana 2 çizgi grafiği (her biri medyan eğrisi + noktalı ortalama eğrisi; medyan koyu yeşil/yeşil, ortalama turuncu-kesikli). Yaş grafiği "yaşa göre fiyat", km grafiği "kilometreye göre fiyat"
**Veri:** `domain.age_depreciation` [yaş, medyan, n, ortalama] ve `domain.km_price` [km, medyan, n, ortalama]; not `domain.age_km_note`
**Gerçek değerler:**
- Yaş: 1 yaş medyan **₺4.23M** (ort ₺4.39M, n 600) → 21 yaş **₺0.63M** (ort ₺0.70M). İlk yıllarda dik düşüş (1→5 yaş: 4.23M→2.65M), sonra yavaşlama.
- Km: 0 km medyan **₺4.15M** (n 961) → 400.000 km **₺0.94M** (n 42). Belirgin azalan-hız eğrisi.
- Ortalama eğri her iki grafikte de medyanın üstünde (fiyat çarpıklığı görünür).
**Anlatı (rapordaki lead):** "Araç yaşlandıkça ve kilometre arttıkça fiyat düşüyor; ilk yıllarda düşüş dik, sonra yavaşlıyor. Hedonik analiz bunu sayısallaştırıyor: yılda %7.1, her 100k km %14.6."
**Not / Method:** "Medyan tipik fiyat, ortalama aykırı-etkili. Açıklık = fiyat çarpıklığı." (rapor bunu genişletilmiş biçimde de anlatır: medyan = tipik fiyat; ortalama = aykırı-etkili; iki eğri arasındaki açıklık fiyat çarpıklığıdır; ayrıca yukarıdaki hedonik %/yıl ve %/100k *kontrollü* etkilerdir, burada gösterilen ham düşüş değil)
**Metodoloji / neden:** Bölüm ham piyasa gerçeğini (medyan/ortalama eğrileri) hedonik *kontrollü* etkiyle bilinçli olarak ayırır. Ham eğrilerdeki düşüş yaş ve km'nin birbirine karışmış (confounded) toplam etkisidir; lead'de verilen yılda %7.1 ve 100k km başına %14.6 ise diğer değişkenler sabitken izole edilen etkilerdir. Medyan + ortalama birlikte çizilerek dağılımın çarpıklığı da görselleştirilir — tek bir "ortalama fiyat" rakamının yanıltıcılığına karşı dürüst bir sunum.

## 03 · Hedonik model — sürücü katsayıları
**Sekme:** Piyasa · **Gösterim:** bootstrap forest plot (nokta + asimetrik %95 CI hata çubukları; pozitif katsayı yeşil, negatif kırmızı) + tam katsayı tablosu + 2 motor-etki kartı (accent) + açılır (details) "cc–HP korelasyonu · yakıt bazında" tablosu + Method notu
**Veri:** `domain.hedonic_reliability` — model_r2, n, bootstrap[10 terim], motor_etki{hp100_pct, cc_litre_pct}, yakit_korelasyon[4], genel_korelasyon, bootstrap_ayar{n_boot, yontem, sure_sn}, not
**Gerçek değerler:** R² **0.9309**, n **29.554**. Bootstrap terimleri (nokta β; % etki = e^β−1; %95 CI; hepsi sıfırı DIŞLIYOR → ✓ anlamlı):
| Terim | β (nokta) | % etki | %95 CI |
|---|---|---|---|
| yaş | −0.0739 | %-7.1 | [−0.076, −0.0718] |
| yaş² | 0.0008 | %+0.1 | [0.0007, 0.001] |
| km(100K) | −0.1576 | %-14.6 | [−0.1678, −0.1478] |
| km² | 0.0172 | %+1.7 | [0.014, 0.0201] |
| yaş×km | −0.0066 | %-0.7 | [−0.0078, −0.0054] |
| ağır hasar | −0.121 | %-11.4 | [−0.1295, −0.1117] |
| boyalı | −0.0106 | %-1.1 | [−0.0115, −0.0096] |
| değişen | −0.0314 | %-3.1 | [−0.0335, −0.0293] |
| +100 HP | 0.1935 | %+21.3 | [0.1745, 0.21] |
| +1 litre | 0.0742 | %+7.7 | [0.0504, 0.1007] |

Motor-etki kartları: **+100 HP etkisi %+21.3** (accent) · **+1 litre etkisi %+7.7** (accent). Yakıt bazında cc–HP korelasyonu (Pearson / Spearman / cc-HP oranı / n): Benzin 0.806 / 0.407 / 9.8 / 14.693; Dizel 0.836 / 0.694 / 11.1 / 12.783; LPG & Benzin 0.900 / 0.805 / 13.9 / 1.199; Hibrit 0.429 / 0.308 / 10 / 879. Genel korelasyon 0.73. Bootstrap ayarı: 1000 iterasyon, "seri, her iterasyonda HC3", 293.5 sn.
**Anlatı (rapordaki lead):** "Hedonik regresyon her sürücünün *kontrollü* (diğer her şey sabitken) fiyat etkisini verir — R² 0.931, n 29.554. Katsayılar bootstrap ile güven aralıklı; hepsinin %95 CI'ı sıfırı DIŞLIYOR → her sürücü güvenilir şekilde anlamlı."
**Not / Method:** "Ham (log yok) cc+HP: birim başına yorum. 1000 bootstrap, her iterasyonda HC3 robust. cc-HP korele ama yakıta göre oran değişir (dizel yüksek). Tüm katsayılar sağlam."
**Metodoloji / neden:** Bu bölüm raporun istatistiksel titizlik vitrini. Forest plot her katsayıyı nokta tahmin + bootstrap %95 CI ile gösterir; hiçbir CI sıfırı içermediğinden her sürücünün anlamlılığı görsel olarak kanıtlanır — "işaret doğru mu, güvenilir mi?" sorusuna tek bakışta cevap. HC3 robust standart hatalar heteroskedastisiteye karşı korur; 1000 iterasyonlu bootstrap SE'lerin dağılım varsayımına bağlı kalmamasını sağlar. cc ve HP korele olduğundan (genel 0.73) çoklu-doğrusallık riski vardır; yakıt bazında cc/HP oranının değişmesi (dizel en yüksek, 11.1) bunun neden ham/birim-başına yorumlandığını ve neden ayrı raporlandığını açıklar. Not: km(100K) katsayısı (−0.1576) hero'daki −%14.6 ile, yaş (−0.0739) −%7.1 ile, ağır hasar (−0.121) −%11.4 ile birebir tutarlıdır — hero ve değer-kaybı lead'i bu bölümden beslenir.

## 04 · Kasa tipine göre fiyat
**Sekme:** Piyasa · **Gösterim:** yatay bar grafiği (medyana göre artan sırada; tek yeşil renk)
**Veri:** `domain.body_median` [kasa_tipi, medyan, n]
**Gerçek değerler (artan sıra):** Hatchback/3 **₺0.83M** (n 844) · Hatchback/5 **₺1.28M** (n 5.829) · MPV **₺1.42M** (n 227) · Sedan **₺1.60M** (n 20.355) · Station wagon **₺1.65M** (n 485) · Coupe **₺2.03M** (n 1.856). En pahalı Coupe, en ekonomik Hatchback/3.
**Anlatı (rapordaki lead):** "Kasa tipi fiyatı belirgin etkiliyor — Coupe en pahalı, Hatchback en ekonomik. Temiz kb_body_type sınıflaması kullanıldı (kirli gb_body_type değil)."
**Not / Method:** — (bu bölümde ayrı Method notu yok; lead içindeki "temiz kb_body_type … (kirli gb_body_type değil)" veri-kaynağı gerekçesidir)
**Metodoloji / neden:** Kasa tipi fiyatın güçlü bir kategorik belirleyicisidir (Coupe medyanı ₺2.03M, Hatchback/3'ün ~2.5 katı). Kritik metodolojik ayrıntı, iki kolon arasındaki bilinçli seçimdir: gürültülü/tutarsız `gb_body_type` yerine temizlenmiş `kb_body_type` kullanılır. Bu, EDA sırasında yapılan veri-kalitesi kararının rapora yansıması ve yanlış etiketlemeden kaynaklı yanlılığın önlenmesidir.

## 5. Segment merdiveni
**Sekme:** Piyasa · **Gösterim:** dikey bar (segmente göre medyan fiyat, her barın üstünde ₺M etiketi; hover'da ilan adedi)
**Veri:** `domain.segment_ladder` — `[segment, medyan, n]`
**Gerçek değerler:** B ₺0.94M (n 127) · C ₺1.30M (n 9.139) · S ₺1.39M (n 32) · D ₺1.54M (n 12.528) · E ₺1.93M (n 7.840) · F ₺2.66M (n 322). Fiyat sıralaması B → C → S → D → E → F, yani B ekonomikten F lükse doğru artıyor (S "spor" küçük-n bir ara sınıf).
**Anlatı (rapordaki lead):** "Segment yükseldikçe fiyat monotonik artıyor: B ekonomik → F/S lüks. Segment aracın boyut sınıfını temsil eder ve ham veriden değil seriden türetildi."
**Not / Method:** — (bu bölümde ayrı Method notu yok)
**Metodoloji / neden:** Segment, kirli/serbest-metin ham beslemeden değil, güvenilir *seri* alanından türetilerek gürültü elenmiş temiz bir boyut-sınıfı ekseni oluşturuluyor. Monotonik artışın gösterilmesi, "segment" değişkeninin fiyat için tutarlı, sıralı (ordinal) bir sinyal taşıdığını kanıtlar — bu da onu modele öznitelik olarak koymayı ve segment bazlı fiyat beklentisi kurmayı meşrulaştırır.

## 6. Seri × Segment (ısı haritası)
**Sekme:** Piyasa · **Gösterim:** ısı haritası (heatmap; y = seri, x = segment, hücre rengi = medyan fiyat; boş kombinasyonlar "—", hover'da ₺M medyan)
**Veri:** `domain.series_segment_matrix` — `[seri, segment, medyan, n]`
**Gerçek değerler:** 18 seri-segment hücresi:
- BMW: 1 Serisi/C ₺1.15M (n 2.725) · 2 Serisi/C ₺2.05M (n 789) · 3 Serisi/D ₺1.43M (n 7.307) · 4 Serisi/D ₺2.09M (n 934) · 5 Serisi/E ₺1.86M (n 5.687) · 6 Serisi/E ₺3.04M (n 51) · 7 Serisi/F ₺2.74M (n 244) · M Serisi/D ₺3.50M (n 82) · Z Serisi/D ₺2.50M (n 59)
- Audi: A1/B ₺0.94M (n 127) · A3/C ₺1.35M (n 5.625) · A4/D ₺1.45M (n 3.046) · A5/D ₺2.23M (n 1.017) · A6/E ₺2.15M (n 1.983) · A7/E ₺2.88M (n 119) · A8/F ₺2.43M (n 78) · S/D ₺2.61M (n 54) · TT/S ₺1.38M (n 31)

En yüksek medyanlar: M Serisi (₺3.50M) ve 6 Serisi (₺3.04M); en düşük: A1 (₺0.94M) ve 1 Serisi (₺1.15M).
**Anlatı (rapordaki lead):** "Hangi seri hangi segmentte yer alıyor ve medyan fiyat nasıl değişiyor."
**Not / Method:** — (ayrı Method notu yok)
**Metodoloji / neden:** İki boyutlu ısı haritası, tek başına segment veya tek başına serinin gizlediği etkileşimi ortaya koyar: aynı segment içinde bile seriye göre büyük fiyat farkları var (ör. D segmentinde 3 Serisi ₺1.43M iken M Serisi ₺3.50M). Bu, fiyatın hem boyut sınıfına hem de model/seri prestijine bağlı olduğunu gösterir ve modelde seri-düzeyi kırılımın gerekliliğini gerekçelendirir. Boş hücrelerin "—" ile bırakılması, veride bulunmayan kombinasyonları sıfırla karıştırmamak (dürüst gösterim) içindir.

## 7. Marka karşılaştırması (büyük-n tuzağı, Cliff's δ)
**Sekme:** Piyasa · **Gösterim:** 2 barlı sütun grafiği (BMW yeşil, Audi mavi; medyan ₺M etiketli) + 2 KPI kartı (Cliff's δ, Mann–Whitney p) + Method notu
**Veri:** `domain.brand_compare` — `{bmw_medyan, audi_medyan, mwu_p, cliffs_delta}`
**Gerçek değerler:** BMW medyanı ₺1.58M (1.575.000) vs Audi ₺1.48M (1.475.000). Mann–Whitney p = 1,7e-22 (istatistiksel olarak son derece anlamlı). Cliff's δ = 0,081 (ihmal edilebilir etki boyutu). KPI kartları: "Cliff's δ 0.081 — etki boyutu (ihmal edilebilir)" ve "Mann–Whitney p 1.7e-22 — anlamlı ama önemsiz".
**Anlatı (rapordaki lead):** "BMW medyanı Audi'den hafif yüksek. İstatistiksel test anlamlı (p<0.001) AMA etki boyutu ihmal edilebilir (Cliff's δ=0.081) — iki marka benzer premium segmentte."
**Not / Method:** "Büyük-n tuzağı: çok veriyle her fark 'anlamlı' çıkar; effect size (δ) gerçeği söyler — fark pratikte önemsiz."
**Metodoloji / neden:** Bu bölüm işverene istatistiksel olgunluğu göstermek için tasarlanmış: p-değeri örneklem büyüdükçe kaçınılmaz olarak küçülür, dolayısıyla "anlamlılık" tek başına yanıltıcıdır. Dağılımdan bağımsız (non-parametrik) Mann–Whitney U testi medyan farkını sınar, ama karar Cliff's δ etki-boyutu ölçütüne dayandırılır — δ≈0,08 "ihmal edilebilir" eşiğinde olduğu için BMW ve Audi pratikte aynı premium fiyat bandındadır. Bu ayrım, modelde markayı tek başına güçlü bir fiyat ayıracı saymamak yönündeki kararı destekler.

## 8. Segmentasyon (KMeans)
**Sekme:** Piyasa · **Gösterim:** 3 küme kartı (renkli nokta + ad + n + medyan ₺M + yaş/km/hp/hasar% satırı + ayırt-edici özellik rozetleri ↑/↓) → yanyana 2 PCA scatter (PC1×PC2 "güç", PC1×PC3 "hasar"; renk = küme) → altında Elbow + Silhouette çizgi grafiği (çift y-ekseni) + Method notu
**Veri:** `domain.kmeans` `[{cluster, ad, n, medyan, yas, km, hp, agir_hasar_pct, ayirt_edici}]`; `domain.pca_scatter` `[PC1,PC2,küme]`; `domain.pca_scatter_13` `[PC1,PC3,küme]`; `methodology.kmeans_selection {elbow, silhouette, secilen_k, not}`
**Gerçek değerler:** 3 küme:
- **Küme 0 — "Yaşlı & yüksek-km ekonomik":** n 11.467 · medyan ₺1.18M · 14 yaş · 264k km · 177 hp · hasar %0 · ayırt edici: gb_mileage ↑, vehicle_age ↑, engine_cc_val ↑
- **Küme 1 — "Genç & temiz premium":** n 17.114 · medyan ₺1.93M · 9 yaş · 132k km · 150 hp · hasar %0 · ayırt edici: gb_mileage ↓, vehicle_age ↓, engine_cc_val ↓
- **Küme 2 — "Hasarlı":** n 1.407 · medyan ₺1.20M · 12 yaş · 215k km · 163 hp · hasar %100 · ayırt edici: is_heavy_damaged ↑, count_changed ↑, count_painted ↑

PCA scatter başlıkları: "PCA — PC1 %29.8 × PC2 %20.4 (güç)" ve "PCA — PC1 %29.8 × PC3 %14.0 (hasar)". k-seçim eğrileri — Elbow (inertia): k2=193.219, k3=164.955, k4=146.147, k5=129.934, k6=115.339, k7=104.003, k8=93.903; Silhouette: k2=0.247, **k3=0.258 (en yüksek)**, k4=0.186, k5=0.204, k6=0.213, k7=0.221, k8=0.240. Seçilen k = 3.
**Anlatı (rapordaki lead):** "3 doğal araç grubu yaş × km × güç ekseninde ayrışıyor; her kümenin farklı medyan fiyatı var. Hasar sinyalini KMeans bağımsız yakalıyor — hedonik ve PCA ile üçlü doğrulama."
**Not / Method:** "k seçimi: silhouette k=3 işaret ediyor; 3 küme hem optimal hem yorumlanabilir. Silhouette k=3 en yuksek; k=3 secildi (silhouette-optimal + net profiller)" (Method notu `ksel.secilen_k` + `ksel.not` ile kuruluyor).
**Metodoloji / neden:** Denetimsiz KMeans, hedonik regresyondan ve PCA'dan bağımsız üçüncü bir yöntemle veriyi doğal gruplara ayırıyor; üç yöntemin de aynı hasar sinyalini yakalaması "üçlü doğrulama" (triangulation) sağlar — tek bir modele bel bağlamadığını gösterir. k=3 keyfi seçilmemiş: Elbow inertia'sı düzgün azalırken karar Silhouette skorunun tepe yaptığı k=3'e dayandırılıyor; bu hem matematiksel optimallik hem de yorumlanabilir profiller (ekonomik / premium / hasarlı) sunar. "Hasarlı" kümesinin %100 ağır-hasar oranıyla küçük ama net ayrışması (n 1.407), hasarın fiyat üzerinde ayrı bir eksen oluşturduğunun denetimsiz kanıtıdır.

## 9. PCA eksen anlamları
**Sekme:** Piyasa · **Gösterim:** 3 loading kartı yanyana (PC1 / PC2 / PC3; her kartta PC adı + açıklanan varyans % + en yüksek 4 yükleme, pozitif yeşil / negatif kırmızı). KMeans bölümünün hemen altında konumlanır.
**Veri:** `methodology.pca_axes` `[{pc, var_pct, top}]`
**Gerçek değerler:**
- **PC1 — %29.8:** gb_mileage +0.55, vehicle_age +0.52, engine_cc_val +0.40, count_painted +0.36 → km/yaş/büyüklük ekseni
- **PC2 — %20.4:** power_hp_val +0.71, engine_cc_val +0.56, vehicle_age −0.23, count_painted −0.23 → motor gücü ekseni
- **PC3 — %14.0:** is_heavy_damaged +0.62, count_local_painted −0.50, count_changed +0.40, count_painted +0.29 → hasar ekseni

İlk iki bileşen toplam varyansın ~%50.2'sini açıklar (29.8 + 20.4).
**Anlatı (rapordaki lead):** "PCA saçılımlarının eksenleri: PC1 km/yaş/büyüklük, PC2 motor gücü (hp/cc), PC3 hasar ekseni. İlk iki PC varyansın ~%50.2'sini açıklıyor — yukarıdaki kümeler bu eksenlerde ayrışıyor (hasarlı küme PC3'te)."
**Not / Method:** — (kartların dışında ayrı Method notu yok; her PC'nin var_pct'si kart başlığında gösterilir)
**Metodoloji / neden:** Bu bölüm bir üstteki PCA scatter'larının eksenlerini yorumlanabilir kılar — PCA'yı "kara kutu boyut indirgeme" olmaktan çıkarıp her bileşene somut fiziksel anlam (kullanım/yaş, güç, hasar) atar. Yüklemelerin (loadings) işaret ve büyüklükleri, PC3'ün is_heavy_damaged +0.62 ile açıkça bir "hasar ekseni" olduğunu gösterir; bu da KMeans'in bağımsız bulduğu "Hasarlı" kümesiyle örtüşür (üçlü doğrulamanın PCA ayağı). Kartların KMeans'in hemen altına yerleştirilmesi, okuyucunun scatter'lardaki küme ayrışmasını doğrudan eksen anlamlarıyla eşleştirebilmesi içindir.

# Model & performans

## Model performans KPI şeridi (özet kartlar)
**Sekme:** Model & performans (rapor başlık bandında, model verisiyle) · **Gösterim:** 4 KPI kartı şeridi (2×2 / 4'lü grid, `fdfcf9` zemin)
**Veri:** `domain.final_results.model_karsilastirma` — {lightgbm, catboost, kazanan, not}; kartlarda `catboost.MAPE/R2`, `lightgbm.MAPE/R2`, min(MAE/MedAE), min(RMSE)
**Gerçek değerler:** CatBoost MAPE **%6.47** (R² 0.975, ★ kazanan) · LightGBM MAPE **%6.72** (R² 0.974) · En iyi MAE **₺110K** (MedAE ₺75K) · En iyi RMSE **₺176K** (5-fold OOF). Not: MAE/MedAE/RMSE kartları iki modelin daha iyisini (Math.min) gösterir → her ikisi de CatBoost'tan gelir.
**Anlatı (rapordaki lead):** — (yalnızca kart etiketleri; lead paragrafı yok)
**Not / Method:** — (kod yorumu: "model performance KPIs (final 5-fold OOF results)")
**Metodoloji / neden:** Rapora giren okuyucuya, ayrıntılı tablodan önce tek bakışta "model ne kadar iyi" cevabını verir. MAPE (yüzde hata) + R² birlikte hem ölçekten-bağımsız isabeti hem açıklanan varyansı özetler; MAE/RMSE mutlak ₺ hatayı verir. Değerler 5-fold OOF olduğundan overfit'siz, dürüst bir vitrin.

## Model karşılaştırması (LightGBM vs CatBoost)
**Sekme:** Model & performans · **Gösterim:** 6 kolonlu tam metrik tablosu + "Örnek tahmin" kartı (3 sütun: Gerçek / CatBoost / LightGBM) + eğitim satırı (mono caption) + Method notu
**Veri:** `domain.final_results.model_karsilastirma` {lightgbm, catboost, kazanan, not} + `domain.final_results.egitim` {n_arac, n_feature, hedef, cv_suresi_sn} + `domain.final_results.ornek_tahmin` {arac, gercek, lightgbm_tahmin, catboost_tahmin}
**Gerçek değerler:**
- Tablo — CatBoost ★: MAPE **%6.47** · R² **0.9746** · MAE **110.060** · MedAE **74.961** · RMSE **175.667**. LightGBM: MAPE **%6.72** · R² **0.9735** · MAE **113.064** · MedAE **77.199** · RMSE **179.720**. Kazanan: **catboost**.
- Örnek tahmin — araç **120i Sport Line**: Gerçek **₺3.00M** · CatBoost **₺2.87M** (2.865.147) · LightGBM **₺2.91M** (2.906.142).
- Eğitim caption'ı (görünen): "Hedef: **log1p(price)** · **16 öznitelik** · 5-fold CV **204.8 sn**". (Veride ayrıca `n_arac`=29.988 var ama bu caption'da gösterilmiyor.)
**Anlatı (rapordaki lead):** "İki gradyan-artırma modeli 5-fold OOF (sızıntısız) ile karşılaştırıldı; final modeller tüm veriyle eğitildi. Kazanan CatBoost — MAPE %6.47 (CatBoost) vs %6.72 (LightGBM); ikisi de %6.5 civarı, başa baş."
**Not / Method:** "Metrikler 5-fold OOF (sızıntısız). Final modeller tüm veriyle eğitildi." (kaynak: `frMk.not`, birebir)
**Metodoloji / neden:** İki lider tree-boosting modelini aynı sızıntısız protokolde (5-fold out-of-fold) karşılaştırmak, tek bir modele körü körüne bağlanmadan seçim yapmayı sağlar. Hedefin `log1p(price)` olması, fiyatın çarpık/geniş dağılımını sıkıştırıp göreli hataları dengeler (pahalı araçların mutlak hatası modeli ezmesin diye). MAPE'lerin başa baş olması (%6.47 vs %6.72) modelin mimariden çok özniteliklerle sınırlı olduğunu gösterir; CatBoost'un ince farkla kazanması kategorik değişken işlemedeki avantajına atfedilir. Örnek tahmin kartı, soyut metrikleri somut tek bir ilanla (120i) doğrulayarak işveren güvenini pekiştirir.

## Fiyat çeyreğine göre hata (quantile MAPE)
**Sekme:** Model & performans · **Gösterim:** dikey bar grafiği (yükseklik 260), bar üstü etiket (MAPE %, 1 ondalık), yeşil (`green`) barlar
**Veri:** `domain.quantile_error` — [çeyrek etiketi, MAPE %] çiftleri (4 satır)
**Gerçek değerler:** Q1 **%7.09** · Q2 **%4.84** · Q3 **%4.31** · Q4 **%3.59**. Hata ucuzdan (Q1) pahalıya (Q4) doğru monoton azalır (7.09 → 3.59).
**Anlatı (rapordaki lead):** "Modelin fiyat çeyreklerine göre hatası. Genelde pahalı araçlarda daha isabetli, ucuz araçlarda daha zorlanır."
**Not / Method:** Koşullu — yalnızca `oofClipped` doğruysa görünür: "Not: bu koşumda birkaç OOF tahmini büyük bir tavana (₺50M) kırpıldığı için yüzde-hatalar şişkin; backtest (%6.6 civarı) gerçek performansı yansıtır." **Canlı veride `oofClipped=false`** (tüm OOF tahminleri ≤ ₺3.61M, ₺50M eşiğinin çok altında) → bu not şu an RENDER EDİLMİYOR.
**Metodoloji / neden:** Tek bir toplam MAPE, modelin fiyat spektrumu boyunca eşit iyi olduğu yanılgısını verebilir. Çeyreklere ayırmak, hatanın nerede yoğunlaştığını dürüstçe açar: ucuz segmentte (Q1) yüzde-hata yüksek çünkü payda küçük ve bu segment daha gürültülü/heterojen (yüksek-km, hasarlı, nadir donanımlar). Pahalı araçlarda dar ve isabetli olması, modelin premium fiyatlamada iş için güvenle kullanılabileceğini gösterir.

## İlan sayısı vs hata (güvenilirlik)
**Sekme:** Model & performans · **Gösterim:** saçılım (scatter), y ekseni **logaritmik**, yarı-saydam yeşil noktalar (size 6, opacity 0.5), yükseklik 300; x ekseni "ilan adedi"
**Veri:** `domain.residual_vs_n` — [n_ilan, medyan_hata_%, medyan_fiyat] üçlüleri (~440 model noktası). Grafik yalnızca x=`r[0]` (ilan adedi) ve y=`r[1]` (medyan hata) kullanır; üçüncü kolon (medyan fiyat) hover/plote girmez.
**Gerçek değerler (örüntü):** Az ilanlı modellerde hata yüksek ve geniş saçılmış — uçlar: 5 ilan → %28.35, 15 ilan → %20.11, 14 ilan → %19.0, 8 ilan → %18.65. Çok ilanlı modellerde hata düşük ve dar bant — ör. 979 ilan → %6.54, 887 → %6.69, 806 → %3.04, 542 → %4.34, 512 → %3.57. Genel eğilim: n arttıkça medyan hata düşer ve varyansı daralır.
**Anlatı (rapordaki lead):** "Az ilanlı modellerde hata yüksek ve saçılmış; çok ilanlı modellerde düşük ve dar. Model, bol veriye sahip araçlarda güvenilir (log eksen)."
**Not / Method:** — (bu bölümde ayrı Method notu yok)
**Metodoloji / neden:** Bir fiyat modelinin en dürüst öz-eleştirisi "nerede güvenilmez" sorusudur. Model başına ilan-adedini medyan hataya karşı çizmek, güvenilirliğin veri yoğunluğuyla nasıl arttığını görselleştirir — istatistiksel öğrenmenin temel gerçeği (küçük örneklem = yüksek varyans). Log-y ekseni, birkaç ondan yüzlerce yüzdeye uzanan hata aralığını tek grafikte okunur kılar. İşveren açısından mesaj: tahminleri bol-ilanlı popüler modellerde güvenle, nadir modellerde temkinle kullan.

## Modelin en iyi ve en çok yanıldığı ilanlar
**Sekme:** Model & performans · **Gösterim:** iki tablo — yeşil başlıklı "En iyi tahminler" (ilk 5) + kırmızı başlıklı "En çok yanıldığı ilanlar" (ilk 6); kolonlar: Model · Yaş · km · Gerçek · Tahmin · Hata
**Veri:** `domain.oof_best` (slice 0–5) ve `domain.oof_outliers` (slice 0–6) — [model_adı, yaş, km, gerçek₺, tahmin₺, hata_%]
**Gerçek değerler:**
- En iyi (hata ≈ %0.0): A3 Sportback 1.4 TFSI Attraction (15 yaş, 213.000 km, ₺0.90M→₺0.90M) · A3 Sedan 1.6 TDI Attraction (10, 198.700, ₺1.25M→₺1.25M) · A5 Sportback 40 TDI Quattro Advance (6, 185.000, ₺3.01M→₺3.00M) · 418i Gran Coupe M Sport (11, 182.000, ₺1.55M→₺1.55M) · 520i Luxury Line (5, 80.250, ₺3.60M→₺3.59M).
- En çok yanıldığı (hepsi aşırı-yüksek tahmin / overprediction): A4 Sedan 2.0 TDI (20 yaş, 355.000 km, gerçek ₺0.64M → tahmin ₺1.60M, **%148.8**) · M2 (10, 153.000, ₺1.65M→₺3.61M, **%119.0**) · 750i Long (19, 271.000, ₺1.19M→₺2.52M, **%111.8**) · 2.0 TFSI Quattro (12, 140.000, ₺1.55M→₺2.99M, **%92.9**) · A6 Sedan 2.0 TDI (15, 345.000, ₺0.56M→₺1.04M, **%86.2**) · 1.8 1.8 T (20, 96.000, ₺0.95M→₺1.71M, **%79.9**).
**Anlatı (rapordaki lead):** "İki uç: model en iyi standart/bol-ilanlı araçlarda, en kötü nadir/uç vakalarda. İki uç birlikte modelin nerede güçlü/zayıf olduğunu dürüstçe gösterir."
**Not / Method:** Koşullu — yalnızca `oofClipped` doğruysa: "Tahmin sütunundaki ₺50M değerleri log-model taşmasının tavana kırpılmasıdır — dürüstçe gösteriyoruz." **Canlı veride `oofClipped=false`** (en yüksek tahmin ₺3.61M) → bu not RENDER EDİLMİYOR.
**Metodoloji / neden:** Tek tek en iyi ve en kötü tahminleri göstermek, toplu metriklerin gizlediği hata anatomisini açar. En iyi vakalar hep bol-ilanlı, standart donanımlı, "temiz" araçlar → modelin sağlam çekirdeği. En kötü vakalar sistematik bir örüntü taşır: yüksek-km (355k, 345k, 271k) ve yaşlı ya da nadir/spor donanımlı (M2, 750i Long) araçlarda model gerçeğin 2 katına kadar aşırı fiyatlıyor — çünkü bu ilanlar muhtemelen hasar/ağır kullanım nedeniyle piyasa-altı satılıyor ve model bunu göremiyor. Uçları saklamak yerine sergilemek, işverene modelin sınırlarını dürüstçe anlatır ve "insan onayı gereken" segmentleri işaret eder.

## Dağılım kayması (drift)
**Sekme:** Model & performans · **Gösterim:** yan yana iki çizgi grafik (grid lg:2) — (1) "Köşeli · kdesiz · frekans" (linear/köşeli çizgi, y = bin başına göreli frekans %, `%` tick soneki) ve (2) "Yumuşak · KDE" (spline/yumuşak çizgi, y ekseni etiketsiz); ardından tam KS/p/PSI/n tablosu + Method notu
**Veri:** `domain.drift.hist` {edges[40], her snapshot: yoğunluk dizisi} → frekans %'ye çevrilir (yoğunluk × binGenişliği × 100); `domain.drift.kde_raw` {x[120]: 0–₺6M, her snapshot: KDE} → yumuşak eğri; `domain.drift.all_pairs` → tablo. Snapshot'lar (`meta.snapshots`, 4 adet): 2026-01-18, 01-27, 03-21, 06-27. (`domain.drift.kde_log` ve `domain.drift.table` mevcut ama bu bölümde KULLANILMIYOR — `table` yalnızca `all_pairs` yoksa devreye giren yedek; `all_pairs` var, dolayısıyla 6-satırlık çift tablosu gösterilir.)
**Gerçek değerler (tablo — 6 çift, `all_pairs`; kolon: Çift · KS · p · PSI · n):**
- 01-18→01-27: KS **0.0055** · p **0.996** · PSI **0.0004** · n **10.109**
- 01-18→03-21: KS **0.0173** · p **0.070** · PSI **0.0015** · n **20.560**
- 01-18→06-27: KS **0.0309** · p **0.000** · PSI **0.0049** · n **48.059**
- 01-27→03-21: KS **0.0161** · p **0.104** · PSI **0.0011** · n **15.717**
- 01-27→06-27: KS **0.0301** · p **0.000** · PSI **0.0038** · n **39.115**
- 03-21→06-27: KS **0.0157** · p **0.118** · PSI **0.0017** · n **28.620**

Örüntü: KS zaman aralığı büyüdükçe artıyor (0.0055 → 0.0309) ve uzak çiftlerde p→0.000 (istatistiksel anlamlı fark); buna karşın PSI'ların tamamı **< 0.005** (≪ 0.10 güvenli eşiği) → pratikte kayma yok.
**Anlatı (rapordaki lead):** "Ham fiyat dağılımının dönemler arası eğrileri neredeyse çakışık → görsel kanıt. KS zamanla hafif büyüyor (istatistiksel kayma) ama PSI hep <0.05 (pratik kayma yok) — model bayatlamıyor. Yine büyük-n tuzağı."
**Not / Method:** "Tablo: 6 snapshot çiftinin tamamı. KS = en büyük dağılım farkı · PSI < 0.10 güvenli / > 0.25 yeniden eğit · p = KS testi anlamlılığı." (birebir)
**Metodoloji / neden:** Canlı bir fiyat modelinin en büyük gizli riski veri kayması (data drift) — piyasa değişip model bayatlarsa tahminler sessizce bozulur. İki tamamlayıcı görsel stil (köşeli-frekans + yumuşak-KDE) dağılımların dönemler arası neredeyse çakıştığını iki farklı okuyucu için de kanıtlar. Sayısal tarafta üç metrik birlikte "büyük-n tuzağını" ifşa eder: n on binlere çıkınca KS testinin p-değeri, pratikte önemsiz farkları bile "istatistiksel anlamlı" (p≈0) ilan eder — bu yüzden tek başına p'ye güvenmek yanıltıcıdır. PSI ise örneklem büyüklüğünden görece bağımsız, iş-kararı odaklı eşiklerle (0.10 güvenli / 0.25 yeniden-eğit) gerçek pratik kaymayı ölçer; hepsinin <0.005 olması modelin yeniden eğitilmeye ihtiyaç duymadığını gösterir. Bu bölüm işverene "modeli ne zaman güncellemem gerekir?" sorusunun izlenebilir, savunulabilir bir cevabını verir.

---
**Kaynak dosya:** `d:\Programming\Analysis\sadik-portfolio\app\_site\report\FinalReportSiteData.tsx` (bileşen satır 421–488) · **Veri:** `d:\Programming\Analysis\sadik-portfolio\public\site_data.json`

**Doğrulama notu:** Canlı veride `oofClipped = false` (birleşik oof_best+oof_outliers'ta en yüksek tahmin ₺3.61M, ₺50M eşiğinin altında). Bu nedenle "Fiyat çeyreğine göre hata" ve "en çok yanıldığı ilanlar" bölümlerindeki ₺50M-kırpma Method notları ile "Örnek tahmin" bölümü dışındaki hiçbir ₺50M uyarısı şu an render EDİLMİYOR; koşullu olarak kodda mevcuttur.

# Metodoloji — model kararları
**Grup başlığı:** `03 · Metodoloji — model kararları` (yalnızca "Metodoloji" sekmesinde / "all" görünümünde). Bölüm numaraları bu grup içinde `01`'den yeniden başlar.

---

## 01 · Öznitelik seçimi
**Sekme:** Metodoloji · **Gösterim:** monospace çip bulutu (tutulan 16 öznitelik) + 3 sütunlu tablo (Grup / Gerekçe / ~kolon) + Method notu (imputasyon)
**Veri:** `methodology.feature_kept` (16 çip), `methodology.feature_drop` ([kod, gerekçe, ~kolon]), `methodology.impute_note`; lead'de `meta.n_features = 16`
**Gerçek değerler:**
- Tutulan 16 öznitelik (çipler, birebir sıra): `model` · `series` · `brand` · `kb_body_type` · `kb_drivetrain` · `segment` · `kb_transmission` · `kb_fuel` · `vehicle_age` · `gb_mileage` · `power_hp_val` · `engine_cc_val` · `count_painted` · `count_changed` · `count_local_painted` · `is_heavy_damaged`
- feature_drop tablosu (Grup · Gerekçe · ~kolon):
  - A · Sabit varyans · ~2
  - B · Redundant kb/gb · ~12
  - B* · Kapsam farkı · 1
  - C · Kimlik/sızıntı · ~8
  - D · Blok-eksik >%40 · ~15
  - E · Spec-eksik ~%26 · ~10
  - F · low/up→val · ~8
  - G · Granüler hasar→agregat · ~50
  - H · Ampirik audit (garanti) · ~2

**Anlatı (rapordaki lead):** "117 ham kolondan 16'ya indirildi. Çıkarma keyfi değil: sabit kolonlar, redundant kb/gb ikizleri, sızıntı/kimlik, blok-eksik, çoklu-bağlantı, granüler hasar (agregatlandı) ve ampirik audit."
**Not / Method (impute_note, birebir):** "Hiyerarsik doldurma: eksikler seri>segment>marka medyani ile dolduruldu (once en spesifik grup). torque_nm %27.6 eksik oldugu icin featuredan cikarildi; digerleri agac modelinde native islenir."
**Metodoloji / neden:** 117 → 16 boyut indirgemesinin denetlenebilir gerekçelendirmesi. Her düşürme sınıfı bir modelleme sorununu adresliyor: sabit kolonlar bilgi taşımaz (A); kb/gb ikiz kolonları çoklu-bağlantı yaratır (B, B*); kimlik/sızıntı kolonları hedefe geçmişten sızar (C); blok-eksik ve spec-eksik güvenilir imputasyona izin vermez (D, E); alt/üst sınır çiftleri tek bir `_val`'a indirgenir (F); ~50 granüler hasar kolonu 4 sayaç + 1 bayrağa agregatlanır (G); ve ampirik audit garanti gibi zararlı sinyalleri eler (H). Hiyerarşik (seri>segment>marka) medyan imputasyonu en spesifik gruptan başlayarak yanlılığı azaltır; ağaç modeli kalan eksikliği native işlediğinden agresif doldurma gereksizdir.

---

## 02 · Sistematik eksiklik
**Sekme:** Metodoloji · **Gösterim:** yatay bar grafiği (30 yüksek-eksik kolon, `h=520`; aynı renk = aynı eksik oranı = birlikte-eksik blok) + 2 blok kartı (3'er KPI'lı) + "Missing korelasyon yapısı" kutusu (3 KPI + paragraf) + "Kritik ayrım" kutusu + Method (SEBEP) notu
**Veri:** `methodology.sistematik_missing.column_missing_all` ([kolon, eksik%], 30 satır, artan sıralı), `methodology.sistematik_missing.sistematik_gruplar` (2 blok: {kolon_sayisi, ort_eksik_pct, birliktelik_pct, ornek_kolonlar}), `methodology.sistematik_missing.not`. Kutulardaki 0.999/1.000/~0.90/0.59 değerleri bileşende sabit-kodlu.
**Gerçek değerler:**
- Çıkarılan 30 yüksek-eksik kolon (eksik %): tramer_fee 84.4 · transmission_brand 74.1 · gb_drivetrain 74.0 · gb_traffic_insurance_avg 54.3 · gb_kasko_avg 51.1 · gb_mtv_yearly 40.6 · city_fuel_cons 31.4 · highway_fuel_cons 31.4 · kb_fuel_cons_avg 30.3 · production_year_start 29.9 · production_year_end 29.9 · rpm_max 29.3 · rpm_min 29.3 · weight_kg 27.7 · kb_fuel_tank 27.6 · trunk_capacity_lt 27.6 · accel_0_100 27.6 · torque_nm 27.6 · max_speed_kmh 27.6 · gb_segment 27.6 · cylinder_count 27.6 · length_mm 27.6 · width_mm 27.6 · height_mm 27.6 · curb_weight_kg 27.6 · wheelbase_mm 27.6 · front_tire_spec 27.6 · seat_count 27.5 · gb_warranty_status 22.1 · eids_model 11.7. (Aynı %'ye sahip kolonlar aynı renkte — ör. 14 kolonun ~27.6'sı tek blok; 31.4 çifti; 29.9 çifti; 29.3 çifti.)
- Blok kartı 1 — **Spec / katalog bloğu**: kolon 24 · ort. eksik %30.8 · birlikte %1.5 · örnek çipler (ilk 4): gb_drivetrain, gb_mtv_yearly, city_fuel_cons, highway_fuel_cons
- Blok kartı 2 — **Sigorta / kasko bloğu**: kolon 2 · ort. eksik %52.7 · birlikte %90 · örnek çipler: gb_traffic_insurance_avg, gb_kasko_avg
- **Missing korelasyon yapısı** kutusu: Blok içi (14 spec) = **0.999** (91/91 çift %99+) · Alt–üst sınır çifti = **1.000** (yıl · rpm · yakıt) · Çiftler arası = **~0.90** (aynı kaynak, farklı tamlık)
- **Kritik ayrım** kutusu: MISSING korelasyonu **0.999** vs DEĞER korelasyonu yalnızca **0.59** (ağırlık–uzunluk 0.90 ama tork–yükseklik düşük)

**Anlatı (rapordaki lead):** "Eksiklik rastgele değil, bloklu: aşağıdaki yüksek-eksik kolonlar (spec/katalog + sigorta, ~%28–84) aynı ilanlarda birlikte boş kalıyor. "Eksik olması" sistematik olduğundan güvenilir imputasyon yok ve sızıntı riski var → bu kolonlar çıkarıldı. (Modele giren 16 öznitelik <%2 eksik — bu grafikte değil.)"
**Grafik başlığı (caption):** "Eksiklik oranı (%) · aynı renk = aynı oran (birlikte eksik blok)"
**Missing korelasyon yapısı kutusu paragrafı (birebir):** "Biri eksikse hepsi eksik (tam blok). Her spec değişkeninin alt–üst sınırı tam %100 birlikte gelir/gelmez: production_year_start↔end, rpm_min↔max, city↔highway fuel. Farklı çiftler arası ~0.90 — hepsi aynı katalog kaynağından ama farklı tamlıkta."
**Kritik ayrım kutusu (birebir):** "Bu MISSING korelasyonu (var/yok birlikte hareket ediyor) — DEĞER korelasyonu DEĞİL. Spec değerleri birbirine sadece 0.59 korele (ağırlık–uzunluk 0.90 ama tork–yükseklik düşük): her spec farklı bilgi taşır, ama var/yok durumları tek kaynağa (katalog eşleştirmesi) bağlı."
**Method / SEBEP notu (birebir):** "Sebep: spec verisi model–katalog eşleştirmesinden gelir — standart modeller ("320i") eşleşir, niş varyantlar ("320i 50th Year M Edition") eşleşmez, o yüzden o ilanların tüm spec'leri birden boş kalır. Modele koymadım: niş varyantlarda hep eksik olurlardı ve model adı (TF-IDF ile) o bilgiyi zaten yakalıyor."
**Veri notu (`sistematik_missing.not`, kartlarda gösterilmez ama veride mevcut):** "Missing korelasyonu yüksek kolonlar birlikte eksik = sistematik. Spec/katalog kolonları (torque, boyutlar, hız...) aynı ilanlarda blok halinde eksik."
**Metodoloji / neden:** MNAR (missing-not-at-random) teşhisi. Eksikliği bir bloğun kolektif davranışı olarak gösterip (aynı renk = aynı oran = aynı ilanlarda eksik), imputasyonun neden imkânsız olduğunu ve neden sızıntı riski taşıdığını kanıtlıyor. Kritik incelik, "eksik olmanın korelasyonu" (0.999, tek katalog-eşleştirme kaynağına bağlı) ile "değerlerin korelasyonu" (0.59, her spec ayrı bilgi) arasındaki ayrım: kolonların bilgi olarak fazlalık olmadığını, sadece mevcudiyetlerinin ortak bir mekanizmaya bağlı olduğunu gösterir. Bu, kolonları modelden çıkarma kararını ("hep niş varyantlarda eksik olurdu + model adı TF-IDF'i zaten sinyali yakalıyor") gerekçelendiren veri-kalitesi analizidir.

---

## 03 · Kategorik bağıntı (Cramér's V + Theil's U)
**Sekme:** Metodoloji · **Gösterim:** yan yana iki ısı haritası (`lg:grid-cols-2`, her biri `h=360`) — solda **Theil's U** (yönlü · ana), sağda **Cramér's V** (simetrik · ikincil); altında `model →` satırlı tablo (Cramér's V, Theil's U). brand/series/model eksen sıralamasında (labels dizisi) yer alır.
**Veri:** `methodology.theils_matrix` ve `methodology.cramers_matrix` ({labels[8], matrix 8×8}), `methodology.assoc_model` ([hedef, Cramér, Theil], 5 satır)
**Gerçek değerler:**
- Isı haritası eksen etiketleri (her ikisi, birebir sıra): `brand`, `kb_body_type`, `kb_drivetrain`, `segment`, `kb_transmission`, `kb_fuel`, `series`, `model`
- Theil's U matrisi (yönlü, satır → sütun): `model` satırı diğerlerini belirlemez (0.13–0.39), ama `model` sütunu diğerlerince yüksek belirlenir — brand→model 1.00, series→model 1.00, segment→model 1.00, kb_drivetrain→model 0.93, kb_body_type→model 0.89, kb_fuel→model 0.88, kb_transmission→model 0.72. Ayrıca series↔segment 1.00 (her iki yön), brand→series 1.00.
- Cramér's V matrisi (simetrik): model ile — brand 1.00, series 0.97, segment 0.95, kb_transmission 0.82, kb_fuel 0.80, kb_body_type 0.78, kb_drivetrain 0.73; brand↔series 1.00, brand↔segment 0.31, brand↔kb_drivetrain 0.85, series↔segment 1.00.
- assoc_model tablosu (`model →` · Cramér's V · Theil's U): brand → 1.000 · 1.000 · series → 0.970 · 0.999 · segment → 0.950 · 0.999 · kb_body_type → 0.777 · 0.892 · kb_fuel → 0.797 · 0.879

**Anlatı (rapordaki lead, birebir):** "Cramér's V ilişkinin gücünü (simetrik), Theil's U yönünü (asimetrik) verir — ikisi de KATEGORİK öznitelikler içindir: `model` (metin), marka, seri, segment, kasa, çekiş, vites, yakıt. `model` diğerlerini neredeyse tam belirliyor (U≈1) ama tersi değil → `model` hedonikten dışlandı (sızıntı). Not: hasar sayaçları ve motor (hp/cc) SAYISAL olduğundan burada değil."
**Grafik başlıkları (caption):** "Theil's U (yönlü · ana)" · "Cramér's V (simetrik · ikincil)"
**Not / Method:** — (bu bölümde ayrı Method notu yok; tablo başlıkları: `model →`, Cramér's V, Theil's U)
**Metodoloji / neden:** Kategorik-kategorik ilişkiyi iki tamamlayıcı ölçüyle inceliyor: Cramér's V simetrik güç (0–1), Theil's U ise asimetrik/yönlü belirsizlik-azaltımı. Yönlülük burada karar-verici: `model` diğer kategorileri neredeyse tam belirler (U≈1 sütun yönünde) ama tersi değildir — yani `model`, marka/seri/segment/yakıt/kasa'yı deterministik olarak kodlar. Bu, `model`'in hedonik regresyona konulmasının sızıntı (hedefe dolaylı erişim) yaratacağını gösterir → hedonikten dışlandı, sinyali TF-IDF üzerinden dolaylı taşınır. Sayısal öznitelikler (hasar sayaçları, hp/cc) burada değil çünkü Cramér/Theil yalnızca kategorikler içindir.

---

## 04 · G ≡ MPV teşhisi
**Sekme:** Metodoloji · **Gösterim:** 3 KPI kartı (Stat), ilki vurgulu (accent) — G ∧ MPV / Toplam G / Toplam MPV
**Veri:** `methodology.g_mpv` = {mpv_and_g, g_total, mpv_total}
**Gerçek değerler:** G ∧ MPV = **214** (vurgulu) · Toplam G = **215** · Toplam MPV = **227**. (Yani "G" segmentinin 215 satırından 214'ü aynı zamanda MPV gövde — G ≈ MPV.)
**Anlatı (rapordaki lead, birebir):** "Ham veride bir "G" segmenti vardı ama gerçek değil: G'lerin neredeyse tamamı MPV gövde (Active/Gran Tourer). Site kendi etiketini uydurmuş. Çözüm: segmenti seriden türet, MPV bilgisini kb_body_type'ta tut. Bir veri kalitesi teşhisi."
**Not / Method:** — (bu bölümde ayrı Method notu yok)
**Metodoloji / neden:** Bir veri-kalitesi teşhisi. Ham beslemedeki "G" segmenti gerçek bir sınıf değil, kaynak sitenin uydurduğu bir etiket — 215 G satırının 214'ü MPV gövde (Active/Gran Tourer) olduğundan G ile MPV neredeyse birebir örtüşür (%99.5). Bu tekilliği ortaya koymak, segmentin seriden türetilmesi ve MPV sinyalinin `kb_body_type`'ta tutulması kararını gerekçelendirir; sahte segment etiketinin modeli kirletmesini önler.

---

## 05 · LOFO — öznitelik önemi
**Sekme:** Metodoloji · **Gösterim:** yatay bar grafiği (`h=420`, ΔRMSE; pozitif = yeşil/önemli, negatif = kırmızı/zararsız gürültü; artan sıralı, sıfır çizgisi vurgulu)
**Veri:** `methodology.lofo` ([öznitelik, ΔRMSE], 11 satır)
**Gerçek değerler (ΔRMSE, öznitelik çıkarılınca RMSE artışı):** gb_mileage **+54497.8** · vehicle_age **+44493.6** · DAMAGE_COLS **+24486.8** · MODEL_SERIES **+17595.3** · count_changed **+5542.1** · is_heavy_damaged **+5072.3** · count_painted **+4230.1** · count_local_painted **+1387.2** · engine_cc_val **+179.6** · ENGINE_SPECS **+27.1** · power_hp_val **−138.6** (tek negatif → zararsız gürültü, atılabilir)
**Anlatı (rapordaki lead, birebir):** "Bir öznitelik çıkarılınca RMSE ne kadar artıyor (pozitif = önemli). Kilometre ve yaş baskın; hasar/güç önemli. Negatif olanlar zararsız gürültü — atılabilir. Permütasyonun göremediği "zararlı feature" sinyalini verir."
**Grafik başlığı (caption):** "ΔRMSE"
**Not / Method:** — (bu bölümde ayrı Method notu yok)
**Metodoloji / neden:** LOFO (Leave-One-Feature-Out) her özniteliği çıkarıp modeli yeniden eğiterek RMSE değişimini ölçer; permütasyon öneminden farkı, korele/etkileşimli özniteliklerde daha dürüst olması ve "zararlı öznitelik" (çıkarılınca hata AZALAN, ΔRMSE<0) sinyalini yakalamasıdır. Sonuç, fiyatın öncelikle kilometre ve yaş, ardından hasar bloğu ve model/seri kimliği tarafından belirlendiğini onaylar; power_hp_val'in negatif ΔRMSE'si (−138.6) onun gürültü kattığını ve güvenle atılabileceğini gösterir.

---

## 06 · Zamansal backtest
**Sekme:** Metodoloji · **Gösterim:** iki doğrulama görünümü — (a) OOF MAPE çizgi grafiği (`h=260`, iki seri: dönem-başına bağımsız [amber] vs kümülatif [koyu/yeşil], yatay legend, y-ekseni %); (b) 4 sütunlu forward-test tablosu (Eğitim→Test · Tek MAPE · Kümül. MAPE · n) + Method notu
**Veri:** `methodology.backtest.per_snapshot` ([dönem, MAPE%, n]), `methodology.backtest.insample` (kümülatif [→dönem, MAPE%, n]), `methodology.backtest.single` ([eğitim, test, MAPE%, n]), `methodology.backtest.cumulative` ([→eğitim, test, MAPE%, n]), `methodology.backtest.not`
**Gerçek değerler:**
- OOF grafiği — **Dönem başına (bağımsız)**: 01-18 %7.15 (10901 ilan) · 01-27 %7.15 (11254) · 03-21 %7.07 (11478) · 06-27 %7.31 (11526) → ~%7.1 sabit
- OOF grafiği — **Kümülatif (t'ye kadar)**: 01-18 %7.19 (10901) · →01-27 %6.91 (13861) · →03-21 %6.63 (21099) · →06-27 %6.60 (29988) → veri arttıkça %7.19'dan %6.60'a iniyor
- Forward-test tablosu (Eğitim → Test · Tek MAPE · Kümül. MAPE · n):
  - 01-18 → 01-27 · %6.62 · %6.62 · 2.960
  - 01-18 → 03-21 · %6.88 · %6.88 · 8.182
  - 01-18 → 06-27 · %7.64 · %7.64 · 10.529
  - 01-27 → 03-21 · %6.68 · %6.57 · 7.413
  - 01-27 → 06-27 · %7.35 · %7.33 · 10.313
  - 03-21 → 06-27 · %7.14 · %7.00 · 9.099

**Anlatı (rapordaki lead, birebir):** "İki doğrulama görünümü. Grafik — OOF MAPE (çapraz-doğrulama): dönem başına bağımsız hata ~%7.1 sabit (hiçbir dönem belirgin zor değil); kümülatif eğitimde veri arttıkça ~%6.6'ya iniyor — daha çok verinin değeri. Tablo — zamansal forward test: eski dönemde eğit, sonraki dönemin YALNIZCA yeni ad_id'lerinde test et (sızıntısız); kümülatif strateji daha stabil → aylık retrain."
**Grafik başlığı (caption):** "OOF MAPE · dönem başına vs kümülatif"
**Not / Method (backtest.not, birebir):** "single: tek snapshotta egit ileriyi tahmin. cumulative: t ye kadar egit. Sadece YENI ad_id (sizintisiz)."
**Metodoloji / neden:** Zaman-farkındalıklı doğrulama, klasik rastgele çapraz-doğrulamanın gizlediği temporal sızıntıyı önler. İki tamamlayıcı bakış: (1) OOF MAPE her dönemin bağımsız zorluğunu (~%7.1 sabit → hiçbir dönem anormal değil) ve kümülatif eğitimin marjinal değerini (%7.19→%6.60, "daha çok veri = daha iyi") gösterir; (2) forward test yalnızca sonraki dönemin YENİ ad_id'lerinde test ederek (aynı ilanın geçmişten görülmesini engelleyerek) sızıntısız genelleme hatasını ölçer. Kümülatif stratejinin tek-dönemden daha stabil olması, üretimde aylık yeniden-eğitim (retrain) kararını doğrudan gerekçelendirir.

---

## Öne çıkan bulgular
**Gösterim:** yeşil kenarlıklı "Öne çıkan bulgular / Key findings" kutusu, her madde `→` oklu — 5 madde (birebir):

1. "Büyük-n tuzağı (marka, drift): istatistiksel anlamlılık ≠ pratik önem — effect size kullanmak olgunluk gösterir."
2. "Dürüst k-seçimi: silhouette ile k bilinçli seçildi, körlemesine değil — şeffaflık olgunluk sinyali."
3. "Sızıntı bilinci: Theil's U asimetrisi `model`i açığa çıkardı → hedonikten dışlandı; temporal test yalnızca yeni ad_id ile."
4. "Üçlü doğrulama: hasar sinyali hedonik + PCA + KMeans'te bağımsızca ortaya çıkıyor."
5. "Retrain'in değeri: kümülatif eğitim ileri-testte tek-dönemden daha stabil."

**Metodoloji / neden:** Kapanış kutusu, metodoloji bölümünün olgunluk-sinyallerini beş başlıkta özetler: (1) büyük örneklemde p-değeri yerine effect-size kullanımı; (2) küme sayısının silhouette ile şeffaf seçimi; (3) yönlü bağıntı (Theil's U) ile sızıntı tespiti ve temporal sızıntısızlık; (4) hasar sinyalinin üç bağımsız yöntemde (hedonik regresyon, PCA, KMeans) tutarlı çıkması; (5) yeniden-eğitimin ampirik değeri. İşverene sunum bağlamında bunlar teknik titizlik ve istatistiksel olgunluğun kanıtı olarak konumlandırılmıştır.

---

**Kaynak dosyalar:** Bileşen `d:\Programming\Analysis\sadik-portfolio\app\_site\report\FinalReportSiteData.tsx` (satır 490–615, METHODOLOGY bloğu + key-findings) · veri `d:\Programming\Analysis\sadik-portfolio\public\site_data.json` (`methodology.*` — not `domain.*`; imputasyon/backtest notları veride Türkçe aksansız, `L()` ile İngilizce fallback'lidir).
