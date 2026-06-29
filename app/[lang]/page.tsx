import { getBlogPosts } from '@/lib/mdx';
import eda from '@/lib/eda-data.json';
import FinalHome from '@/app/_site/FinalHome';


export default function Page() {
    const recentPosts = getBlogPosts().slice(0, 3);
    const priceByYear = eda.priceByYear.years.map((year: number, i: number) => ({
        year,
        price: eda.priceByYear.avg[i],
    }));
    return <FinalHome recentPosts={recentPosts} priceByYear={priceByYear} />;
}
