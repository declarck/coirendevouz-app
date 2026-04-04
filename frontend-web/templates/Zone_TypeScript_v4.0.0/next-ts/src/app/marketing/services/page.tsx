import { CONFIG } from 'src/global-config';

import { MarketingServicesView } from 'src/sections/_marketing/view/marketing-services-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Services | Marketing - ${CONFIG.appName}` };

export default function Page() {
  return <MarketingServicesView />;
}
