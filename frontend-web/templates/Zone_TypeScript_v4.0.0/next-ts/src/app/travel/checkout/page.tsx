import { _tours } from 'src/_mock';
import { CONFIG } from 'src/global-config';

import { TravelCheckoutView } from 'src/sections/_travel/view/travel-checkout-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Checkout | Travel - ${CONFIG.appName}` };

export default function Page() {
  return <TravelCheckoutView tour={_tours[0]} />;
}
