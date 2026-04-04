import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

type Props = {
  title: string;
  description?: string;
  roadmapRef?: string;
};

export function PanelPlaceholderView({ title, description, roadmapRef }: Props) {
  const { t } = useTranslate('coirendevouz');

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description ?? t('placeholder.screenSoon')}
        </Typography>
        {roadmapRef ? (
          <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: 'block' }}>
            {roadmapRef}
          </Typography>
        ) : null}
      </Box>
    </Container>
  );
}
