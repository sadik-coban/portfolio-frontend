# İkinci El Araç Piyasası Analizi — SHAP Raporu

Model fiyatı **neye bakarak** kuruyor? Burada açıklanan model LightGBM — teknik raporun kısaca "model" dediği. CatBoost'un iki varyantı yalnız §4'teki karşılaştırmada geçiyor. Sorular veri ölçeğinde: hangi öznitelik ne kadar pay alıyor, etki değerler değiştikçe nasıl değişiyor.

## 1. SHAP nedir, LOFO'dan farkı ne

**SHAP** tek bir tahmini parçalarına ayırır: bu ilanda yaş fiyatı şu kadar yukarı itti, kilometre şu kadar aşağı çekti; parçaların toplamı tahmini tam verir. Teknik rapordaki **ablasyon / LOFO** (Leave-One-Feature-Out) ise bir öznitelik çıkarılınca *hatanın* ne kadar büyüdüğüne bakar.

## 2. Nasıl hesaplandı

- **Veri:** 29.988 ilanın **tamamı** — örnekleme yok.
- **Model: OOF.** Her ilan, onu eğitimde hiç görmemiş fold modeliyle açıklanıyor (5-fold, üreticinin kurulumunun aynısı). Yeniden üretilen tahminler yayımlananlarla kuruşu kuruşuna aynı çıktı.
- **Yöntem:** `shap.TreeExplainer` (exact). Toplamsallık hatası 6.6e-13, yani parçalar tahmini tam veriyor.
- **Ölçek:** hedef `log1p(fiyat)`, yani katkılar log'da toplanıyor ve fiyatta **çarpan** oluyor (aşağıdaki tablo).
- **Gruplama:** model/seri adının 170 SVD boyutu tek tek anlamsız, `MODEL_SERIES` altında toplandı. §3'teki tabloda `ENGINE` = hp + cc, `DAMAGE` = 13 panel + ağır hasar; beeswarm ve kohort grafiklerinde bunlar ayrı satır.

### Hangi grafikte hangi ölçek

Her grafikte okura en anlamlı ölçek seçildi:

| ölçek | nerede | neden |
|---|---|---|
| **log** | beeswarm, kohort, etkileşim | İlanlar arası karşılaştırılabilir **tek** ölçek: `+0.62` ucuz araçta da pahalı araçta da aynı anlama gelir. |
| **%** | bağımlılık eğrileri, tablodaki **fiyatta karşılığı** sütunu | Katkıyı çarpana çevirir: `e^s − 1`. +0.10 → ×1.105, yani %10.5 daha pahalı; −0.10 → ×0.905, %9.5 daha ucuz. |

**Örnek hesap.** Yaş (yıl) kaleminin ortalama |SHAP|'i 0.2872 → `e^0.2872 = 1.333`, yani tipik bir ilanda fiyatı %33.3 oynatıyor. Aynı ilanda Motor (hp + cc) de 0.1360 eklemişse yüzdeler toplanmaz, çarpanlar çarpılır: `1.333 × 1.146 = 1.527` → %52.7, %33.3 + %14.6 = %47.8 değil.

## 3. Fiyatı ne belirliyor

![Fiyatı en çok ne belirliyor](figures/tr-sh-01-importance.png)

| öznitelik | ortalama \|SHAP\| | pay | fiyatta karşılığı |
|---|---:|---:|---:|
| Yaş (yıl) | 0.2872 | %43.6 | %33.3 |
| Motor (hp + cc) | 0.1360 | %20.7 | %14.6 |
| Kilometre | 0.0839 | %12.8 | %8.8 |
| Model/seri adı | 0.0709 | %10.8 | %7.3 |
| Hasar (13 panel) | 0.0413 | %6.3 | %4.2 |
| Segment | 0.0264 | %4.0 | %2.7 |
| Kasa tipi | 0.0071 | %1.1 | %0.7 |
| Vites | 0.0043 | %0.7 | %0.4 |
| Yakıt | 0.0009 | %0.1 | %0.1 |
| Çekiş | 0.0001 | %0.0 | %0.0 |
| Marka | 0.0001 | %0.0 | %0.0 |

*Paylar LightGBM'e özgü (§4).*

**Yaş (yıl)** tek başına atfın %43.6'sini, ilk üç öznitelik %77.1'ini alıyor.

### Yön kontrolü

![Her nokta bir ilan](figures/tr-sh-02-beeswarm.png)

Etki yönü korelasyonu (Spearman): yaş **-0.99**, kilometre **-0.96**, motor gücü **+0.89**. Yaş ve km arttıkça fiyat aşağı, güç arttıkça yukarı gidiyor. Bu bir tutarlılık kontrolü; ters işaret çıksaydı veri ya da model bozuk olurdu.

![Etki düz değil](figures/tr-sh-03-dependence.png)

Üç eğri üç farklı davranış gösteriyor:

- **Yaş neredeyse düz bir iniş:** medyan katkı 0–2 yaşta +0.64, 18+ yaşta -0.63. Uçtan uca **3.6 kat** fiyat farkı; modelin en güçlü kuralı.
- **Kilometrenin bedeli** (ardışık bantların medyan katkı farkı, bantlar eşit genişlikte olmadığı için 100 bin km'ye oranlanmış): 25→125 bin km arasında %8.5, 125→225 binde %10.9, 225→425 binde %5.9. Son bantta belirgin düşüş var: çok yüksek kilometrede ek kilometre artık fiyatı pek oynatmıyor — o bölgede zaten yalnız 1.723 ilan var.
- **Motor gücünde eşik var:** 150 hp altından 250 hp üstüne medyan katkı -0.16 → +0.36 (**1.7 kat**). Sıçrama dar bir bantta, sonrası düz; güç burada "üst donanım" işareti olarak çalışıyor olabilir.

### Model her araçta aynı şeye bakmıyor

![İki kohort](figures/tr-sh-04-cohorts.png)

Bölmeyi biz vermedik: shap kendi karar ağacıyla veriyi **Yaş (yıl) = 9.5** eşiğinden ikiye ayırdı. *Yaş (yıl)* için ortalama |SHAP| iki grupta 0.40 ve 0.23, yani genç araçta yaklaşık 1.7 katı ağırlık. §3'teki sıralama bir **ortalama**: yeni araçta fiyatı yaş kurar, yaşlıda sıra diğerlerine geçer.

### Yaş ve kilometre birlikte çalışıyor

![Aynı kilometre, farklı yaş](figures/tr-sh-05-km-age.png)

Renk aracın yaşı. Aynı **150–250 bin km** bandında kilometre katkısının medyanı 10 yaş altında -0.03 (2.232 ilan), 10 yaş üstünde -0.01 (9.000 ilan): model yaşlı araçta kilometre için daha az ceza kesiyor, yaşı zaten cezalandırmış. İki öznitelik bağımsız değil (§7).

## 4. Üç varyant aynı fiyatı farklı gerekçeyle kuruyor

| öznitelik | LightGBM | CatBoost (SVD) | CatBoost (native) |
|---|---:|---:|---:|
| Yaş (yıl) | %43.6 | %30.8 | %32.2 |
| Motor (hp + cc) | %20.7 | %17.2 | %17.2 |
| Kilometre | %12.8 | %22.1 | %22.9 |
| Model/seri adı | %10.8 | %14.0 | %18.5 |
| Hasar (13 panel) | %6.3 | %7.5 | %6.4 |
| Segment | %4.0 | %6.8 | %0.2 |
| Kasa tipi | %1.1 | %0.4 | %1.1 |
| Vites | %0.7 | %0.9 | %0.1 |
| Yakıt | %0.1 | %0.1 | %0.0 |
| Çekiş | %0.0 | %0.2 | %0.2 |
| Marka | %0.0 | %0.0 | %1.2 |

Teknik rapora göre üç varyant doğrulukta pratikte eşit. Gerekçede değiller: LightGBM yaşa %43.6 pay veriyor, CatBoost %30.8 (12.8 puan fark), kilometrede durum tersine dönüyor (%12.8 · %22.1). Yaş ile kilometre birlikte hareket ettiği için payın hangisine yazılacağı modelin tercihi. **Sonuç:** "yaş en önemli öznitelik" modele bağlı; "yaş + km + motor birlikte belirleyici" üç modelde de doğru.

## 5. Marka neden sıfıra yakın

`brand`'in ortalama |SHAP|'i **0.0001**, atfın %0.00'i. Model markayı neredeyse hiç kullanmıyor, çünkü model adı markayı zaten belirliyor (teknik rapor §3: U(marka | model) = 1.00).

Üç yöntem — bağımlılık ölçüsü, ablasyon, SHAP — aynı yere çıkıyor: **marka ayrı bilgi taşımıyor.** Bu "marka fiyatı etkilemez" demek değil; etkisi model adının içinde.

## 6. Tek bir ilanda karar

![316i M Sport](figures/tr-sh-06-waterfall.png)

Soldaki `E[f(x)]` modelin hiçbir öznitelik bilmeden verdiği değer, sağdaki `f(x)` bu ilana verdiği tahmin; aradaki her ok bir özniteliğin katkısı (log ölçek, §2).

- **İlan:** 316i M Sport · 2014 · 171.000 km
- **Gerçek fiyat:** ₺1.495.000
- **İlanı görmemiş modelin tahmini:** ₺1.419.715 (-%5.0)

Tahmini kuran en büyük üç kalem:

1. Motor gücü (hp) = 136 hp → ×0.89
2. Yaş (yıl) = 12 yıl → ×0.94
3. Model/seri adı = 316i M Sport → ×0.97

Kilometre gibi küçük kalemler toplamı pek oynatmıyor; kararı birkaç büyük ok kuruyor.

%5.0’lik fark hiçbir çubukta görünmüyor: SHAP **tahmini** parçalara ayırır, gerçek fiyatı değil. Modelin neyi bilmediği dökümde yazmaz.

## 7. Kısıtlar

- **Atıf, nedensellik değil.** SHAP modelin neyi kullandığını söyler, piyasanın nasıl çalıştığını değil.
- **Birlikte hareket eden öznitelikler payı bölüşür.** Yaş ile kilometrenin payı modele göre değişiyor (§4). TreeSHAP burada `tree_path_dependent` modda, yani gözlemsel; pay dağılımı bu seçime de bağlı.
- **Katkılar log uzayında.** Kalemleri karşılaştırırken **çarpanlara** bakın: her ilanda aynı anlama gelirler. Liraya çevirmek ilana özgü ve sıraya bağlı olduğu için bu raporda yapılmadı.
- **Gruplama bir karardır.** `MODEL_SERIES` 170 SVD boyutunun toplamı; tek tek bakılsa her biri küçük görünür ve toplam etki gizlenirdi.
