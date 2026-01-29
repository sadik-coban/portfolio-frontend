// src/app/page.tsx
import { getBlogPosts } from '@/lib/mdx';
import PortfolioHome from '@/components/home/PortfolioHome'; // Yukarıdaki yeni bileşen yolu

export default function Page() {
  // Bu kod sunucuda çalışır, fs kullanabilir, sorun yok.
  const allPosts = getBlogPosts();
  const recentPosts = allPosts.slice(0, 3);

  // Veriyi Client Component'e prop olarak atıyoruz.
  return <PortfolioHome recentPosts={recentPosts} />;
}