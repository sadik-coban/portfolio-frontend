import FinalAbout from '@/app/_site/FinalAbout';
import { pageMetadata } from '@/app/_site/seo';

export const generateMetadata = pageMetadata('/about');

export default function Page() {
    return <FinalAbout />;
}
