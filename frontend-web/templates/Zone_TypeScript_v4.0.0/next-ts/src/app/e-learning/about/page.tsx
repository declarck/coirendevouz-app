import { CONFIG } from 'src/global-config';

import { ElearningAboutView } from 'src/sections/_elearning/view/elearning-about-view';

// ----------------------------------------------------------------------

export const metadata = { title: `About us | E-learning - ${CONFIG.appName}` };

export default function Page() {
  return <ElearningAboutView />;
}
