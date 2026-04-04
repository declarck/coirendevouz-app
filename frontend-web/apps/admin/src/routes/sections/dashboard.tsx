import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';
import { BusinessProvider } from 'src/contexts/business/business-context';

import { LoadingScreen } from 'src/components/loading-screen';

import { AccountLayout } from 'src/sections/account/account-layout';

import { AuthGuard } from 'src/auth/guard';
import { BusinessAccessGuard } from 'src/auth/guard/business-access-guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const CoirendevouzOverviewPage = lazy(() => import('src/pages/dashboard/coirendevouz/overview'));
const ServicesPage = lazy(() => import('src/pages/dashboard/coirendevouz/services'));
const ServiceNewPage = lazy(() => import('src/pages/dashboard/coirendevouz/service-new'));
const ServiceEditPage = lazy(() => import('src/pages/dashboard/coirendevouz/service-edit'));
const StaffPage = lazy(() => import('src/pages/dashboard/coirendevouz/staff'));
const StaffNewPage = lazy(() => import('src/pages/dashboard/coirendevouz/staff-new'));
const StaffEditPage = lazy(() => import('src/pages/dashboard/coirendevouz/staff-edit'));
const SchedulePage = lazy(() => import('src/pages/dashboard/coirendevouz/schedule'));
const AppointmentDetailPage = lazy(
  () => import('../../pages/dashboard/coirendevouz/appointment-detail')
);
const ManualAppointmentPage = lazy(() => import('src/pages/dashboard/coirendevouz/manual-appointment'));

const AccountGeneralPage = lazy(() => import('src/pages/dashboard/user/account/general'));
const AccountBillingPage = lazy(() => import('src/pages/dashboard/user/account/billing'));
const AccountSocialsPage = lazy(() => import('src/pages/dashboard/user/account/socials'));
const AccountNotificationsPage = lazy(
  () => import('src/pages/dashboard/user/account/notifications')
);
const AccountChangePasswordPage = lazy(
  () => import('src/pages/dashboard/user/account/change-password')
);

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardShell = (
  <BusinessProvider>
    <BusinessAccessGuard>
      <DashboardLayout>
        <SuspenseOutlet />
      </DashboardLayout>
    </BusinessAccessGuard>
  </BusinessProvider>
);

const accountLayout = () => (
  <AccountLayout>
    <SuspenseOutlet />
  </AccountLayout>
);

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? dashboardShell : <AuthGuard>{dashboardShell}</AuthGuard>,
    children: [
      { index: true, element: <CoirendevouzOverviewPage /> },
      {
        path: 'services',
        element: <Outlet />,
        children: [
          { index: true, element: <ServicesPage /> },
          { path: 'new', element: <ServiceNewPage /> },
          { path: ':id/edit', element: <ServiceEditPage /> },
        ],
      },
      {
        path: 'staff',
        element: <Outlet />,
        children: [
          { index: true, element: <StaffPage /> },
          { path: 'new', element: <StaffNewPage /> },
          { path: ':id/edit', element: <StaffEditPage /> },
        ],
      },
      { path: 'schedule', element: <SchedulePage /> },
      {
        path: 'appointments',
        children: [
          { index: true, element: <Navigate to="/dashboard/schedule" replace /> },
          { path: 'manual', element: <ManualAppointmentPage /> },
          { path: ':id', element: <AppointmentDetailPage /> },
        ],
      },
      {
        path: 'user',
        children: [
          { index: true, element: <Navigate to="/dashboard/user/account" replace /> },
          {
            path: 'account',
            element: accountLayout(),
            children: [
              { index: true, element: <AccountGeneralPage /> },
              { path: 'billing', element: <AccountBillingPage /> },
              { path: 'notifications', element: <AccountNotificationsPage /> },
              { path: 'socials', element: <AccountSocialsPage /> },
              { path: 'change-password', element: <AccountChangePasswordPage /> },
            ],
          },
        ],
      },
    ],
  },
];
