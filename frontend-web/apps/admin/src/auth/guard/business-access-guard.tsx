import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { getAccessToken } from 'src/lib/auth-session';
import { useBusinessContext } from 'src/contexts/business/use-business-context';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks';
import { signOut as jwtSignOut } from 'src/auth/context/jwt/action';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export function BusinessAccessGuard({ children }: Props) {
  const router = useRouter();
  const { checkUserSession } = useAuthContext();
  const { loading, error, businesses, selectedBusiness, refetch } = useBusinessContext();

  const handleSignOut = useCallback(async () => {
    await jwtSignOut();
    await checkUserSession?.();
    router.replace(paths.auth.jwt.signIn);
  }, [checkUserSession, router]);

  if (CONFIG.auth.skip && !getAccessToken()) {
    return <>{children}</>;
  }

  if (loading) {
    return <SplashScreen />;
  }

  if (error === 'forbidden') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          İşletme paneline erişim yetkiniz yok. Bu alan yalnızca işletme yöneticisi veya personel
          hesapları içindir.
        </Alert>
        <Button variant="contained" onClick={handleSignOut}>
          Çıkış yap
        </Button>
      </Container>
    );
  }

  if (error === 'network') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          İşletme bilgileri yüklenemedi. API adresini ve ağ bağlantısını kontrol edin.
        </Alert>
        <Button variant="contained" onClick={() => void refetch()}>
          Yeniden dene
        </Button>
      </Container>
    );
  }

  if (businesses.length === 0 || !selectedBusiness) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Stack spacing={2}>
          <Typography variant="h5">Bağlı işletme yok</Typography>
          <Typography variant="body2" color="text.secondary">
            Hesabınıza atanmış aktif bir işletme bulunmuyor. Yöneticiyseniz işletme kaydı oluşturulduğunda
            buradan devam edebilirsiniz.
          </Typography>
          <Box>
            <Button variant="outlined" onClick={handleSignOut}>
              Çıkış yap
            </Button>
          </Box>
        </Stack>
      </Container>
    );
  }

  return <>{children}</>;
}
