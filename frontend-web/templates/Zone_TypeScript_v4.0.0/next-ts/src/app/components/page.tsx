import { CONFIG } from 'src/global-config';

import { ComponentsView } from 'src/sections/_examples/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Components - ${CONFIG.appName}` };

export default function ComponentsPage() {
  return <ComponentsView />;
}
