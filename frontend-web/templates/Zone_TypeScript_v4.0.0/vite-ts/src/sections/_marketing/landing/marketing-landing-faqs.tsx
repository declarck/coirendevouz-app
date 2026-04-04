import type { BoxProps } from '@mui/material/Box';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';

import { _faqs } from 'src/_mock';
import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function MarketingLandingFaqs({ sx, ...other }: BoxProps) {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChangeExpanded = useCallback(
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    },
    []
  );

  const renderTexts = () => (
    <Box sx={{ mb: 5, textAlign: { xs: 'center', md: 'left' } }}>
      <Typography variant="overline" sx={{ mb: 2, display: 'block', color: 'text.disabled' }}>
        FAQS
      </Typography>

      <Typography variant="h2">Frequently asked questions</Typography>
    </Box>
  );

  const renderFaqs = () =>
    _faqs.map((faq) => (
      <Accordion
        key={faq.id}
        expanded={expanded === faq.question}
        onChange={handleChangeExpanded(faq.question)}
      >
        <AccordionSummary>
          <Typography variant="h6" sx={{ pr: 1, flexGrow: 1 }}>
            {faq.question}
          </Typography>

          <Iconify
            icon={expanded === faq.question ? 'mingcute:minimize-line' : 'mingcute:add-line'}
            sx={{ transform: 'translateY(4px)' }}
          />
        </AccordionSummary>

        <AccordionDetails sx={{ color: 'text.secondary' }}>{faq.answer}</AccordionDetails>
      </Accordion>
    ));

  const renderImage = () => (
    <Box
      component="img"
      loading="lazy"
      alt="Faqs"
      src={`${CONFIG.assetsDir}/assets/illustrations/illustration-faqs.svg`}
      sx={{ width: 480 }}
    />
  );

  return (
    <Box
      component="section"
      sx={[{ pt: { xs: 5, md: 10 }, pb: { xs: 10, md: 15 } }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <Container>
        <Grid container spacing={3} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
            {renderTexts()}
            {renderFaqs()}
          </Grid>

          <Grid sx={{ display: { xs: 'none', md: 'block' } }} size={{ xs: 12, md: 6, lg: 5 }}>
            {renderImage()}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
