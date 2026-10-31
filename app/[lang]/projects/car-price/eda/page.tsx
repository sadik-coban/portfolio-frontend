import FinalEda from '@/app/_site/FinalEda';
import eda from '@/lib/eda-data.json';
import { pageMetadata } from '@/app/_site/seo';

export const generateMetadata = pageMetadata('/projects/car-price/eda');

export default function Page() {
    return <FinalEda eda={eda} />;
}
