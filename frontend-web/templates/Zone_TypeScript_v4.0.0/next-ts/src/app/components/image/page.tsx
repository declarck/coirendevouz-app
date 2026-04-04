import { CONFIG } from 'src/global-config';

import { ImageView } from 'src/sections/_examples/image-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Image | Components - ${CONFIG.appName}` };

export default function Page() {
  return <ImageView />;
}
