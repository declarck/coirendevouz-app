import type { Dayjs } from 'dayjs';
import type { BoxProps } from '@mui/material/Box';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

import { Iconify } from 'src/components/iconify';

import { FilterTime } from './filter-time';
import { FilterGuests } from './filter-guests';
import { FilterLocation } from './filter-location';

// ----------------------------------------------------------------------

export function TravelFilters({ sx, ...other }: BoxProps) {
  const [departureDay, setDepartureDay] = useState<Dayjs | null>(null);

  const [guests, setGuests] = useState({ adults: 0, children: 0 });

  const handleChangeDepartureDay = useCallback((newValue: Dayjs | null) => {
    setDepartureDay(newValue);
  }, []);

  const handleIncrement = useCallback(
    (guest?: string) => {
      if (guest === 'children') {
        setGuests({ ...guests, children: guests.children + 1 });
      } else {
        setGuests({ ...guests, adults: guests.adults + 1 });
      }
    },
    [guests]
  );

  const handleDecrease = useCallback(
    (guest?: string) => {
      if (guest === 'children') {
        setGuests({ ...guests, children: guests.children - 1 });
      } else {
        setGuests({ ...guests, adults: guests.adults - 1 });
      }
    },
    [guests]
  );

  return (
    <Box
      sx={[
        {
          p: 4,
          gap: 2.5,
          display: 'flex',
          borderRadius: 2,
          alignItems: { md: 'center' },
          bgcolor: 'background.neutral',
          flexDirection: { xs: 'column', md: 'row' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <FilterLocation />

      <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', md: 'block' } }} />

      <FilterTime value={departureDay} onChange={handleChangeDepartureDay} sx={{ py: 2 }} />

      <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', md: 'block' } }} />

      <FilterGuests
        value={guests}
        onDecrease={handleDecrease}
        onIncrement={handleIncrement}
        sx={{ py: 2 }}
      />

      <Button
        size="large"
        color="secondary"
        variant="contained"
        sx={{ px: 0, flexShrink: 0, minWidth: { xs: 1, md: 48 } }}
      >
        <Iconify icon="carbon:search" />
      </Button>
    </Box>
  );
}
