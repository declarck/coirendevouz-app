import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { getApiErrorMessage } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { registerAccount } from '../../context/jwt';
import { FormHead } from '../../components/form-head';

// ----------------------------------------------------------------------

export type BusinessSignUpSchemaType = zod.infer<typeof BusinessSignUpSchema>;

export const BusinessSignUpSchema = zod.object({
  full_name: zod.string().min(1, { message: 'Ad soyad gerekli.' }),
  email: zod
    .string()
    .min(1, { message: 'E-posta gerekli.' })
    .email({ message: 'Geçerli bir e-posta girin.' }),
  phone: zod.string().optional(),
  password: zod
    .string()
    .min(1, { message: 'Şifre gerekli.' })
    .min(8, { message: 'Şifre en az 8 karakter olmalı (API ile uyumlu).' }),
});

// ----------------------------------------------------------------------

export function JwtBusinessSignUpView() {
  const router = useRouter();
  const showPassword = useBoolean();
  const { checkUserSession } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: BusinessSignUpSchemaType = {
    full_name: '',
    email: '',
    phone: '',
    password: '',
  };

  const methods = useForm<BusinessSignUpSchemaType>({
    resolver: zodResolver(BusinessSignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage(null);
    try {
      await registerAccount({
        email: data.email.trim(),
        password: data.password,
        full_name: data.full_name.trim(),
        phone: (data.phone ?? '').trim(),
        role: 'business_admin',
      });
      await checkUserSession?.();
      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  });

  return (
    <>
      <FormHead
        title="İşletme yöneticisi kaydı"
        description={
          <>
            Zaten hesabınız var mı?{' '}
            <Link component={RouterLink} href={paths.auth.jwt.signIn} variant="subtitle2">
              Giriş yapın
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>MVP:</strong> Burada yalnızca işletme yöneticisi kullanıcısı açılır. İşletme (salon) kaydı
        ayrıca oluşturulmalıdır; davet/self-serve işletme akışı yok. İşletme bağlanana kadar işletme listesi
        boş olabilir.
      </Alert>

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
          <Field.Text name="full_name" label="Ad soyad" slotProps={{ inputLabel: { shrink: true } }} />

          <Field.Text name="email" label="E-posta" slotProps={{ inputLabel: { shrink: true } }} />

          <Field.Text
            name="phone"
            label="Telefon (isteğe bağlı)"
            placeholder="+90..."
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Text
            name="password"
            label="Şifre"
            placeholder="En az 8 karakter"
            type={showPassword.value ? 'text' : 'password'}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={showPassword.onToggle} edge="end">
                      <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator="Kayıt yapılıyor…"
          >
            Hesap oluştur
          </Button>
        </Box>
      </Form>
    </>
  );
}
