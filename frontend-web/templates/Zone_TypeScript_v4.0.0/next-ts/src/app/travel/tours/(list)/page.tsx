import { _tours } from 'src/_mock';
import { CONFIG } from 'src/global-config';

import { TravelToursView } from 'src/sections/_travel/view/travel-tours-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Tour list | Travel - ${CONFIG.appName}` };

export default function Page() {
  return <TravelToursView tours={_tours} />;
}
