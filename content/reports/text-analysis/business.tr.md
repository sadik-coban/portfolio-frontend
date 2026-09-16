# Metin Analizi — Karar Notu

> Üretilmiş dosya — kaynak `metrics/*.json` + `data/langextract/extraction_results.jsonl`, üreteç `clean/text_analysis/build_text_report.py`. Her sayı kaynaktan okunur/hesaplanır.

Teknik dayanak: [technical.tr.md](technical.tr.md)

## İlan metni ne işe yarar, ne işe yaramaz

**Fiyat tahmininde işe yaramaz.** Yapısal veri fiyatı zaten çözüyor (R² 0.9645); metni eklemek doğruluğu **0.0015** artırıyor — yani pratikte sıfır. Metnin değeri başka yerde: yapısal alanların hiç görmediği işlerde.

## Metin "temiz" diyor, form başka söylüyor

**163 ilan** metinde temiz/hasarsız iddia ediyor ama satıcının **kendi yapısal beyanı** hasar gösteriyor. Ham sayı 1.220 idi; 1.057 tanesi masum çıktı (kapsamlı iddia, "X hariç" beyanı, yalnız lokal rötuş) ve ayıklandı.

> **Bu gizli hasar değil.** Sayaçlar satıcının kendi beyanı — bilgi ilanın içinde zaten var. Çelişen şey vitrin metni ile form. Dolandırıcılık iddiası **değildir**.

![İlan aslında ne iddia etmişti](figures/tr-03-claim-type.png)

![Çelişkili ilanlarda hasarın ağırlığı](figures/tr-01-severity.png)

Hasarın çoğu hafif ya da orta: %43.6 hafif, %51.5 orta, %4.9 ağır. Yani "temiz" demek çoğu vakada tamamen asılsız değil — ama form başka söylüyor.

## Bu çelişki prim getiriyor mu? Hayır.

Ham bakışta bu ilanlar **-%12.8** farklı fiyatlanıyor gibi görünüyor. Ama araç özellikleri ve hasar sabitlenince kontrollü etki **%1.4** (%95 GA -0.7…3.5). Daha geniş popülasyonda (başlıkta temiz ama yapısal hasar var, 2.856 ilan): ham -%9.4, kontrollü **%0**.

**Sonuç: sistematik bir aldatma prim getirmiyor.** Ham fark kompozisyondan geliyor — kontrollü ≠ ham.

![Kontrollü etki (%95 GA)](figures/tr-05-controlled-effects.png)

## Metnin gerçek değeri

- **Veri tamamlama:** metinde gerçek hasar anlatan ama sayacı boş **3.964 ilan** var. Yapısal alan orada eksik; metin dolduruyor.
- **Donanım:** donanım alanları yapısal şemada **hiç yok**; metin tek kaynak.
- **Çapraz kontrol:** metin ile yapısal alanlar 8 ayrı alanda çelişiyor — inceleme kuyruğu.

![Alan çelişki sayısı (metin ↔ yapısal)](figures/tr-07-field-contradictions.png)

> **Anomali = inceleme adayı, kanıt değil.** Bu kuyruk bir suçlama listesi değil; elle bakılacak ilanları sıraya koyar.
