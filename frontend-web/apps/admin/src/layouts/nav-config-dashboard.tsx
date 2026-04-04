import type { NavSectionProps } from 'src/components/nav-section';

import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  user: icon('ic-user'),
  job: icon('ic-job'),
  calendar: icon('ic-calendar'),
  booking: icon('ic-booking'),
  product: icon('ic-product'),
  dashboard: icon('ic-dashboard'),
};

// ----------------------------------------------------------------------

/**
 * İşletme paneli — Coirendevouz modülleri (Minimals demo menüsü kaldırıldı).
 * Metinler `coirendevouz` i18n ad alanından gelir; dil değişince menü güncellenir.
 */
export function useDashboardNavData(): NavSectionProps['data'] {
  const { t } = useTranslation('coirendevouz');

  return [
    {
      subheader: t('nav.subheader.general'),
      items: [
        { title: t('nav.overview'), path: paths.dashboard.coirendevouz.overview, icon: ICONS.dashboard },
        { title: t('nav.schedule'), path: paths.dashboard.coirendevouz.schedule, icon: ICONS.calendar },
        {
          title: t('nav.manualAppointment'),
          path: paths.dashboard.coirendevouz.manualAppointment,
          icon: ICONS.booking,
        },
      ],
    },
    {
      subheader: t('nav.subheader.settings'),
      items: [
        { title: t('nav.staff'), path: paths.dashboard.coirendevouz.staff, icon: ICONS.job },
        { title: t('nav.services'), path: paths.dashboard.coirendevouz.services, icon: ICONS.product },
        {
          title: t('nav.profile'),
          path: paths.dashboard.user.account,
          icon: ICONS.user,
          deepMatch: true,
        },
      ],
    },
  ];
}
