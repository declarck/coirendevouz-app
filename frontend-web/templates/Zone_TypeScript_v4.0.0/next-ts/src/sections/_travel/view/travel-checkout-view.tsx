'use client';

import type { ITourProps } from 'src/types/tour';
import type { BoxProps } from '@mui/material/Box';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Form } from 'src/components/hook-form';

import { TravelCheckOutSummary } from '../checkout/travel-check-out-summary';
import { TravelCheckOutPaymentForm } from '../checkout/travel-check-out-payment-form';
import { TravelCheckOutShippingForm } from '../checkout/travel-check-out-shipping-form';

// ----------------------------------------------------------------------

const BillingAddressSchema = zod.object({
  firstName: zod.string().min(1, { message: 'First name is required!' }),
  lastName: zod.string().min(1, { message: 'Last name is required!' }),
  fullAddress: zod.string().min(1, { message: 'Full address is required!' }),
  fullAddress2: zod.string(),
});

const ShippingAddressSchema = zod.object({
  firstName: zod.string(),
  lastName: zod.string(),
  fullAddress: zod.string(),
  fullAddress2: zod.string(),
});

const PaymentMethodsSchema = zod.object({
  methods: zod.string(),
  card: zod.object({
    number: zod.string(),
    holder: zod.string(),
    expired: zod.string(),
    ccv: zod.string(),
  }),
});

const TourDetailsSchema = zod.object({
  id: zod.string().optional(),
  slug: zod.string().optional(),
  departureDay: zod.union([zod.string(), zod.null()]),
  guests: zod.object({ adults: zod.number(), children: zod.number() }),
});

export const TravelCheckoutSchema = zod.object({
  billingAddress: BillingAddressSchema,
  shippingAddress: ShippingAddressSchema,
  paymentMethods: PaymentMethodsSchema,
  tourDetails: TourDetailsSchema,
});

export type TravelCheckoutSchemaType = zod.infer<typeof TravelCheckoutSchema>;

// ----------------------------------------------------------------------

type ViewProps = {
  tour?: ITourProps;
};

export function TravelCheckoutView({ tour }: ViewProps) {
  const router = useRouter();

  const sameBilling = useBoolean();

  const defaultValues: TravelCheckoutSchemaType = {
    billingAddress: { firstName: '', lastName: '', fullAddress: '', fullAddress2: '' },
    shippingAddress: { firstName: '', lastName: '', fullAddress: '', fullAddress2: '' },
    paymentMethods: { methods: 'paypal', card: { number: '', holder: '', expired: '', ccv: '' } },
    tourDetails: {
      id: tour?.id,
      slug: tour?.slug,
      departureDay: null,
      guests: { adults: 2, children: 1 },
    },
  };

  const methods = useForm<TravelCheckoutSchemaType>({
    resolver: zodResolver(TravelCheckoutSchema),
    defaultValues,
  });

  const { reset, handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
      router.push(paths.travel.orderCompleted);
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Container sx={{ pb: { xs: 10, md: 15 } }}>
      <Typography component="h1" variant="h3" sx={{ my: { xs: 3, md: 5 } }}>
        Confirm and pay
      </Typography>

      <Form methods={methods} onSubmit={onSubmit}>
        <Grid container spacing={{ xs: 5, md: 8 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <StepLabel title="Shipping information" step="1" />

            <TravelCheckOutShippingForm
              sameBilling={sameBilling.value}
              onChangeSameBilling={sameBilling.onToggle}
            />

            <Divider sx={{ my: 5, borderStyle: 'dashed' }} />

            <StepLabel title="Payment methods" step="2" />

            <TravelCheckOutPaymentForm
              name="paymentMethods.methods"
              options={[
                {
                  label: 'Paypal',
                  value: 'paypal',
                  description:
                    'You will be redirected to PayPal website to complete your purchase securely.',
                },
                {
                  label: 'Credit / debit',
                  value: 'creditcard',
                  description: 'We support Mastercard, Visa, Discover and Stripe.',
                },
              ]}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <TravelCheckOutSummary
              slug={tour?.slug || ''}
              price={tour?.price || 0}
              tourGuide={tour?.tourGuide}
              coverUrl={tour?.coverUrl || ''}
              ratingNumber={tour?.ratingNumber || 0}
              totalReviews={tour?.totalReviews || 0}
            />
          </Grid>
        </Grid>
      </Form>
    </Container>
  );
}

// ----------------------------------------------------------------------

type StepLabelProps = BoxProps & {
  step: string;
  title: string;
};

function StepLabel({ step, title, sx, ...other }: StepLabelProps) {
  return (
    <Box
      sx={[
        { mb: 3, gap: 1.5, display: 'flex', typography: 'h6', alignItems: 'center' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          flexShrink: 0,
          display: 'flex',
          borderRadius: '50%',
          alignItems: 'center',
          typography: 'subtitle1',
          bgcolor: 'primary.main',
          justifyContent: 'center',
          color: 'primary.contrastText',
        }}
      >
        {step}
      </Box>

      {title}
    </Box>
  );
}
