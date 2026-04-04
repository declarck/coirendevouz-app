import { CONFIG } from 'src/global-config';

import { TravelPostsView } from 'src/sections/_travel/view/travel-posts-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Post list | Travel - ${CONFIG.appName}` };

export default function Page() {
  return <TravelPostsView />;
}
