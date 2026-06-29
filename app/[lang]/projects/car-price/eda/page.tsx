import FinalEda from '@/app/_site/FinalEda';
import eda from '@/lib/eda-data.json';


export default function Page() {
    return <FinalEda eda={eda} />;
}
