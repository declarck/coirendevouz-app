import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export const metadata = { title: `Blank - ${CONFIG.appName}` };

export default function Page() {
  return (
    <Container sx={{ minHeight: 560 }}>
      <Typography variant="h4">Blank page</Typography>
    </Container>
  );
}
