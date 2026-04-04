import { _tours } from 'src/_mock';
import { CONFIG } from 'src/global-config';

import { TravelTourView } from 'src/sections/_travel/view/travel-tour-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Tour details | Travel - ${CONFIG.appName}` };

export default function Page() {
  return <TravelTourView tour={_tours[0]} relatedTours={_tours.slice(-4)} />;
}
