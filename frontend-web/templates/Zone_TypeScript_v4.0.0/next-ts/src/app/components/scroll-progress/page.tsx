import { CONFIG } from 'src/global-config';

import { ScrollProgressView } from 'src/sections/_examples/scroll-progress-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Scroll progress | Components - ${CONFIG.appName}` };

export default function Page() {
  return <ScrollProgressView />;
}
