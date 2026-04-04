import { CONFIG } from 'src/global-config';

import { MarketingPostView } from 'src/sections/_marketing/view/marketing-post-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Post details | Marketing - ${CONFIG.appName}` };

export default function Page() {
  return <MarketingPostView />;
}
