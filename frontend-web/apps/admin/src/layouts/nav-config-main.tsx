import type { NavMainProps } from './main/nav/types';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * Ana site menüsü — işletme paneli odaklı; Minimals demo sayfaları kaldırıldı.
 * Çoğu kullanıcı `/` ile doğrudan panele yönlendirilir.
 */
export const navData: NavMainProps['data'] = [
  {
    title: 'Panel',
    path: paths.dashboard.root,
    icon: <Iconify width={22} icon="solar:home-angle-bold-duotone" />,
  },
  {
    title: 'Giriş',
    path: paths.auth.jwt.signIn,
    icon: <Iconify width={22} icon="solar:shield-keyhole-bold-duotone" />,
  },
];
