import type { Metadata } from 'next';

import { _caseStudies } from 'src/_mock';
import { CONFIG } from 'src/global-config';

import { MarketingCaseStudyView } from 'src/sections/_marketing/view/marketing-case-study-view';

// ----------------------------------------------------------------------

type Params = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Params) {
  const { id } = await params;

  const data = await fetchCaseStudy(id);

  return <MarketingCaseStudyView caseStudy={data} relatedCaseStudies={_caseStudies.slice(0, 3)} />;
}

// ----------------------------------------------------------------------

async function fetchCaseStudy(paramId: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return _caseStudies.find((caseStudy) => caseStudy.id === paramId);
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

/**
 * Docs:
 * https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes#generating-static-params
 */
export async function generateStaticParams() {
  return _caseStudies.map((caseStudy) => ({
    id: caseStudy.id,
  }));
}

/**
 * Docs:
 * https://nextjs.org/docs/app/building-your-application/optimizing/metadata#dynamic-metadata
 */

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;

  const data = await fetchCaseStudy(id);

  return {
    title: `${data?.title} | Marketing - ${CONFIG.appName}`,
  };
}
