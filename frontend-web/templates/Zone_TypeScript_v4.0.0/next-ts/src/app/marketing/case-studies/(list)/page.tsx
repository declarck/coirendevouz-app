import { _caseStudies } from 'src/_mock';
import { CONFIG } from 'src/global-config';

import { MarketingCaseStudiesView } from 'src/sections/_marketing/view/marketing-case-studies-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Case studies | Marketing - ${CONFIG.appName}` };

export default function Page() {
  return <MarketingCaseStudiesView caseStudies={_caseStudies} />;
}
