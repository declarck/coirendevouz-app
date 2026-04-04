import { CONFIG } from 'src/global-config';

import { TravelPostView } from 'src/sections/_travel/view/travel-post-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Post details | Travel - ${CONFIG.appName}` };

export default function Page() {
  return <TravelPostView />;
}
