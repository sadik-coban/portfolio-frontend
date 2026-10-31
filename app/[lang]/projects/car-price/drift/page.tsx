import FinalDrift from '@/app/_site/drift/FinalDrift';
import { pageMetadata } from '@/app/_site/seo';

export const generateMetadata = pageMetadata('/projects/car-price/drift');

export default function Page() {
    return <FinalDrift />;
}
