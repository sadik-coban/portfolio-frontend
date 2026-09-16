# Metin Analizi — Teknik Rapor

> Üretilmiş dosya — üreteç `clean/text_analysis/build_text_report.py`.

Karar özeti: [business.tr.md](business.tr.md)

## 1. Metin fiyat doğruluğuna ne katıyor

Bu, iddia değil **ölçüm**: yapısal-yalnız R² **0.9645**, metin eklenince **0.966** → ΔR² **0.0015**. Aynı OOF protokolü. Metnin fiyat tahminine katkısı pratikte sıfırdır; analizin geri kalanı bu kabulün üzerine kurulu.

## 2. Çelişki bayrağı nasıl kuruldu

Naif eşleşme 1.220 ilan veriyordu. Bayrak iddia-türünü sayaç-türüyle eşler (değişensiz↔değişen, boyasız↔boya) ve şunları **dışlar**: kapsamlı yapısal iddia (şase/motor hatasız), "X hariç" beyanı, yalnız lokal rötuş. 1.057 masum ayıklandı → gerçek çelişki **163**.

Şiddet tanımı: `ağır=pert/ağır-hasar VEYA 3+ değişen panel · orta=1-2 değişen ya da 3+ boya · hafif=≤2 boya & 0 değişen`

Ortalama 2.17 boyalı, 0.42 değişen panel.

![Kaç panel boyalı vs değişen](figures/tr-02-panel-dist.png)

## 3. Kontrollü katsayı tablosu

Tüm metin sinyalleri **tek** hedonik log-OLS'te eşzamanlı, HC3 robust SE ile. n **29.562**, R² **0.9308**. Kontroller: yaş · log_km · hp · segment · kasa · yakıt · çekiş · hasar sayaçları · series (HC3 robust SE)

| sinyal | kontrollü % | %95 GA | ham % | n |
|---|---:|---:|---:|---:|
| Premium audio | 5.5 | 4.8…6.1 | 83.5 | 3.055 |
| Mod suspension | 5.1 | 3.7…6.5 | -9.2 | 418 |
| Mod exhaust | 3.5 | 1.4…5.6 | -13.0 | 285 |
| Servis kayıtlı | 3.1 | 1.3…4.9 | 18.4 | 226 |
| Yetkili servis | 2.0 | 1.4…2.5 | 53.2 | 3.248 |
| Mod engine/tune | 1.9 | -0.5…4.4 | -21.0 | 211 |
| Aldatıcı 'temiz' iddiası (gizli hasar) | 1.9 | -0.2…3.9 | -12.9 | 161 |
| Navigation | 1.5 | 1.0…1.9 | 51.3 | 6.558 |
| Heated seats | 1.5 | 1.0…2.0 | 44.4 | 6.866 |
| Panoramic roof | 0.9 | 0.5…1.3 | 38.0 | 10.749 |
| Driver assist | 0.8 | 0.3…1.3 | 91.2 | 5.570 |
| Mod wheels/body | 0.4 | -1.2…2.1 | -10.8 | 226 |
| Garanti | 0.1 | -0.4…0.6 | 13.5 | 2.878 |
| Leather seats | -0.4 | -0.9…0.1 | 22.3 | 4.752 |

> **Kontrollü ≠ ham.** Ham fark büyük ölçüde kompozisyondan gelir; her fiyat iddiası araç özellikleri sabitlenerek verilir. Bunlar **ilişki**, nedensellik değil.

## 4. Residual sinyalleri (triyaj)

Modelin en çok *düşük* tahmin ettiği %5'lik dilimde (1.500 ilan) hangi metin sinyalleri beklenenden fazla görünüyor? Lift = gözlenen / beklenen.

![Under-predict sinyalleri — en yüksek %5'te yoğunlaşma (lift)](figures/tr-06-residual-signals.png)

> Kaynakta 1 sinyal daha var ama **robust değil** — rapora alınmadı. Sağlamlık testini geçmeyen sinyal triyaj listesine giremez.

## 5. Donanım kapsaması

Donanım alanları yapısal şemada yok → metin tek kaynak. 15 terim, olumsuzluk-güvenli eşleşme ("sunroof yok" pozitif sayılmaz), Türkçe `ı/i` toleranslı.

![Donanım anılma oranı (metin tek kaynak)](figures/tr-04-equipment.png)

## 6. LangExtract ile kapsam doğrulama

İlan metinleri bir kez **offline** olarak Google **LangExtract** ile yapılandırılmış çıkarıma sokuldu (çıkarım modeli Gemini 3.1 Flash Lite): **13.904 ilan · 41.866 çıkarım** (ilan başına ort. 3.0), bunların 13.867 tanesi analiz kümesinde → kapsama **%46.2**. Hizalamanın %95.9'i `match_exact`.

| sınıf | çıkarım |
|---|---:|
| Hasar | 19.800 |
| Bakim | 14.086 |
| Modifiye | 4.433 |
| Beygir | 3.547 |

> **Tek işlevi kapsam doğrulama.** Bu çıkarımlar fiyat özniteliği DEĞİL; regex sözlüğünün neyi kaçırdığını ölçmek için kullanıldı. Sayılar bu raporda `data/langextract/extraction_results.jsonl`'dan **hesaplanır**, elle yazılmaz.

## 7. Gizlilik ve kapsam dışı bırakılanlar

- Ham ilan metni bu rapora **hiç** girmez; yalnız sayım ve agregalar.
- `ad_id` **hiç** yazılmaz: model + fiyat yan yana geldiğinde ad_id orijinal ilanı doğrudan işaret eder.
- `residual_keywords` bloğu **kullanılmaz** — inceleme sonucu reddedildi (donanım/renk artefaktı).
- Robust olmayan residual sinyalleri dışarıda.
