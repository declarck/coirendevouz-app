'use client';

import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';

import { paths } from 'src/routes/paths';

import { _mock } from 'src/_mock';

import { Iconify } from 'src/components/iconify';
import { Player, PlayerDialog } from 'src/components/player';

import { ComponentBox, ComponentLayout } from '../layout';

// ----------------------------------------------------------------------

export function PlayerView() {
  const openVideo = useBoolean();

  return (
    <ComponentLayout
      heroProps={{
        heading: 'Player',
        links: [{ name: 'Components', href: paths.components }, { name: 'Player' }],
        moreLinks: ['https://www.npmjs.com/package/react-player'],
      }}
    >
      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          md: 'repeat(2, 1fr)',
        }}
      >
        <ComponentBox title="Player">
          <Player controls url={_mock.video(0)} />
        </ComponentBox>

        <ComponentBox title="With dialog">
          <Fab color="primary" variant="extended" onClick={openVideo.onTrue}>
            <Iconify width={22} icon="solar:play-outline" />
            Open with Dialog
          </Fab>

          <PlayerDialog
            open={openVideo.value}
            onClose={openVideo.onFalse}
            videoPath={_mock.video(0)}
          />
        </ComponentBox>
      </Box>
    </ComponentLayout>
  );
}
