import { CONFIG } from 'src/global-config';

import { ElearningPostsView } from 'src/sections/_elearning/view/elearning-posts-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Post list | E-learning - ${CONFIG.appName}` };

export default function Page() {
  return <ElearningPostsView />;
}
