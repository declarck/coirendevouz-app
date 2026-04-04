import { CONFIG } from 'src/global-config';

import { FormValidationView } from 'src/sections/_examples/form-validation-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Form validation | Components - ${CONFIG.appName}` };

export default function Page() {
  return <FormValidationView />;
}
