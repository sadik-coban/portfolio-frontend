import FinalPredict from '@/app/_site/predict/FinalPredict';
import { pageMetadata } from '@/app/_site/seo';

export const generateMetadata = pageMetadata('/projects/car-price/predict');

export default function Page() {
    return <FinalPredict />;
}
