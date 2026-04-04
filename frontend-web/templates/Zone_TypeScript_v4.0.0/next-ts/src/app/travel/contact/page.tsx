import { CONFIG } from 'src/global-config';

import { TravelContactView } from 'src/sections/_travel/view/travel-contact-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Contact us | Travel - ${CONFIG.appName}` };

export default function Page() {
  return <TravelContactView />;
}
