import { CONFIG } from 'src/global-config';

import { ElearningContactView } from 'src/sections/_elearning/view/elearning-contact-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Contact us | E-learning - ${CONFIG.appName}` };

export default function Page() {
  return <ElearningContactView />;
}
