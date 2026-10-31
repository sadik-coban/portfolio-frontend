import FinalBiDashboard from '@/app/_site/bi/FinalBiDashboard';
import { pageMetadata } from '@/app/_site/seo';

export const generateMetadata = pageMetadata('/projects/car-price/dashboard');

export default function Page() {
    return <FinalBiDashboard />;
}
