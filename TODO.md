# Sonradan düzeltilecekler

2026-11-01'deki performans çalışmasında bulunanlar. Her madde bağımsız, sırayla yapılması gerekmiyor.
Satır numaraları o günkü koda göre.

## 1. Paylaşım etiketleri eksik (Open Graph)

**Durum.** Sitenin hiçbir sayfasında `og:site_name` ve `og:type` yok; bunlar yalnızca 404 sayfalarında
çıkıyor. `og:image` ve `twitter:image` hiçbir yerde yok, `twitter:card` da `summary`. Link paylaşılınca
önizlemede görsel çıkmıyor.

**Sebep.** Next metadata'yı segmentler arasında sığ birleştiriyor: bir alt segmentin `openGraph`'ı
üsttekinin `openGraph`'ını *tamamen* değiştiriyor. `pageSeo` (`app/_site/seo.ts`) yalnızca
`{ locale, title, description }` döndürüyor; kök layout'taki `siteName`, `type` (ve bir görsel
tanımlanırsa `images`) bu yüzden düşüyor. Görselin yokluğunun sebebi ise ayrı:
`app/_site/site-config.ts`'te `openGraph.image` ve `twitter.image` boş.

**Düzeltme.**
- `pageSeo`'nun `openGraph`'ına `site.openGraph`'tan `siteName`, `type` ve (varsa) `images`'ı da ekle.
- Bir paylaşım görseli ekle: 1200×630, JPEG, 300 KB'ın altında (WhatsApp daha büyüğünü göstermiyor).
  Ya `public/`'e koyup `site-config.ts`'teki `image` alanlarına yaz, ya da `opengraph-image.tsx` ile
  üret. `twitter.image` dolunca kart kendiliğinden `summary_large_image` oluyor.

**Kontrol.** Canlı sayfanın `<head>`'inde `og:site_name`, `og:type`, `og:image` görünmeli. Bir linki
WhatsApp'ta ve LinkedIn'de paylaşıp önizlemeye bak. WhatsApp önizlemeyi önbelleğe alır: denerken linkin
sonuna `?v=2` ekle.

## 2. Lint: `FinalShell` içinde render sırasında tanımlanan bileşen

**Durum.** `npx eslint app/_site/FinalShell.tsx` iki hata veriyor (`react-hooks/static-components`,
satır 141 ve 173). Sebep: `NavList` (satır 69) `FinalShell`'in gövdesinde tanımlı. Her render'da yeni bir
bileşen tipi oluşuyor, React da altındaki ağacı her seferinde sıfırdan kuruyor; bu, içerideki state'in
kaybolması ve gereksiz DOM yenilemesi demek.

**Düzeltme.** `NavList`'i dosya düzeyine taşı; `nav`, `active` ve `lang`'ı prop olarak geçir.

## 3. Statik sayfalar: kalan küçük farklar

**Arka plan.** 2026-11-01'e kadar bütün sayfalar her istekte sunucuda baştan çiziliyordu
(`Cache-Control: private, no-store`, `X-Vercel-Cache: MISS`, ilk bayt yaklaşık 0,3 sn); sayfalarda
isteğe göre değişen veri olmadığı hâlde. Sebep üç okumaydı: kök layout `<html lang>` için ve `[lang]`
layout'u hreflang için `x-pathname` başlığını, car-price layout'u da kenar çubuğu çerezini okuyordu.
`perf: serve every page prebuilt…` commit'i bu üçünü kaldırdı; sayfalar artık derlemede üretilip CDN'den
sunuluyor. Canlıdaki 10 sayfanın meta etiketleri ve görünümü değişmedi.

**Kalan farklar** (ikisi de 404 sayfalarında; acil değil):
- Bilinmeyen adreslerin 404'ü Next'in `__next_error__` kabuğuyla geliyor: sunucu HTML'inde `lang` ve
  JSON-LD yok, sayfa tarayıcıda tamamlanıyor. Durum kodu 404, `noindex` var, ekranda aynı görünüyor.
  Kök layout `[lang]` altındayken Next 16'nın davranışı bu. Sunucuda tam çizilmesi istenirse
  `experimental.globalNotFound` ile `app/global-not-found.tsx` denenebilir.
- Kapalı sayfalar (blog, günlük, mRFEI, metin analizi) 404 dönerken artık sayfanın başlığını ve
  canonical'ını taşımıyor. 404 için bu daha doğru.

**Dikkat.** Next 16.1.6'nın derleyicisi, `${…}` içeren iki template literal `+` ile birleşince metnin bir
kısmını düşürüyor. `app/_site/sidebar-collapse-boot.ts`'teki betik bu yüzden tek parça; bölünmemeli.

## 4. Dashboard için fikirler (isteğe bağlı)

- **İlk açılış.** Dashboard boş bir kabukla geliyor; veri, JS yüklendikten sonra tarayıcıdan sırayla
  `/api/bi/meta` ve `/api/bi/agg` ile çekiliyor. Varsayılan filtrelerin sonucu herkese aynı. Sunucuda
  önbellekli çekilip sayfayla birlikte gönderilirse ilk açılış dolu gelir; filtre değişimleri yine
  tarayıcıdan gider. Filtreler URL'de tutulursa Cache Components (`"use cache"` + `cacheLife`) her
  kombinasyonu ayrı önbelleğe alır.
- **Proxy önbelleği.** `app/api/[...path]/route.ts` her yanıtı `no-store` gönderiyor. `bi/meta` ve
  `bi/agg` aynı istek için herkese aynı sonucu dönüyorsa, verinin güncellenme sıklığına uygun kısa bir
  `s-maxage` Railway'e giden istekleri azaltır. `predict` ve `data-drift` bunun dışında kalmalı.
