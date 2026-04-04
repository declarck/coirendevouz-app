'use client';

import type { ITourProps } from 'src/types/tour';

import Container from '@mui/material/Container';

import { TravelNewsletter } from '../travel-newsletter';
import { TravelFilters } from '../filters/travel-filters';
import { TravelTourList } from '../list/travel-tour-list';

// ----------------------------------------------------------------------

type ViewProps = {
  tours?: ITourProps[];
};

export function TravelToursView({ tours }: ViewProps) {
  return (
    <>
      <Container>
        <TravelFilters sx={{ mt: { xs: 3, md: 5 }, mb: { xs: 5, md: 10 } }} />

        <TravelTourList tours={tours || []} />
      </Container>

      <TravelNewsletter />
    </>
  );
}
