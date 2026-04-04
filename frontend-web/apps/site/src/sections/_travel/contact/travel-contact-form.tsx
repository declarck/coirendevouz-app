import type { BoxProps } from '@mui/material/Box';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';

import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type TravelContactSchemaType = zod.infer<typeof TravelContactSchema>;

export const TravelContactSchema = zod.object({
  fullName: zod.string().min(1, { message: 'Full name is required!' }),
  subject: zod.string().min(1, { message: 'Subject is required!' }),
  message: zod.string().min(1, { message: 'Message is required!' }),
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
});

// ----------------------------------------------------------------------

export function TravelContactForm({ sx, ...other }: BoxProps) {
  const defaultValues: TravelContactSchemaType = {
    fullName: '',
    subject: '',
    email: '',
    message: '',
  };

  const methods = useForm<TravelContactSchemaType>({
    resolver: zodResolver(TravelContactSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      console.info('DATA', data);
      reset();
    } catch (error) {
      console.error(error);
    }
  });

  const renderImage = () => (
    <Box
      component="img"
      alt="Travel contact"
      src={`${CONFIG.assetsDir}/assets/illustrations/illustration-travel-contact.svg`}
      sx={{ width: 480 }}
    />
  );

  const renderTexts = () => (
    <>
      <Typography variant="h3">Drop us a line</Typography>
      <Typography sx={{ mt: 2, mb: 5, color: 'text.secondary' }}>
        We normally respond within 2 business days.
      </Typography>
    </>
  );

  const renderForm = () => (
    <Box sx={{ gap: 2.5, display: 'flex', flexDirection: 'column' }}>
      <Field.Text name="fullName" label="Full name" />
      <Field.Text name="email" label="Email" />
      <Field.Text name="subject" label="Subject" />
      <Field.Text name="message" multiline rows={4} label="Message" />

      <Button
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        sx={{ mr: 'auto', ml: { xs: 'auto', md: 'unset' } }}
      >
        Send request
      </Button>
    </Box>
  );

  return (
    <Box
      component="section"
      sx={[{ py: { xs: 10, md: 15 } }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <Container>
        <Grid container spacing={3} sx={{ justifyContent: 'space-between' }}>
          <Grid sx={{ display: { xs: 'none', md: 'block' } }} size={{ xs: 12, md: 6, lg: 5 }}>
            {renderImage()}
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 6 }} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            {renderTexts()}

            <Form methods={methods} onSubmit={onSubmit}>
              {renderForm()}
            </Form>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
