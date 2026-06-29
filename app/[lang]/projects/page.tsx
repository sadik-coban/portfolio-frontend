import eda from '@/lib/eda-data.json';
import FinalProjects from '@/app/_site/FinalProjects';


export default function Page() {
    const priceByYear = eda.priceByYear.years.map((year: number, i: number) => ({ year, price: eda.priceByYear.avg[i] }));
    return <FinalProjects priceByYear={priceByYear} />;
}
