import type { IJobProps } from 'src/types/job';
import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { CareerJobItem } from './career-job-item';

// ----------------------------------------------------------------------

type Props = BoxProps & {
  jobs: IJobProps[];
};

export function CareerJobList({ jobs, sx, ...other }: Props) {
  return (
    <>
      <Box
        sx={[
          {
            columnGap: 4,
            display: 'grid',
            rowGap: { xs: 4, md: 5 },
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        {jobs.map((job) => (
          <CareerJobItem key={job.id} job={job} />
        ))}
      </Box>

      <Pagination
        count={10}
        sx={{ my: 10, [`& .${paginationClasses.ul}`]: { justifyContent: 'center' } }}
      />
    </>
  );
}
