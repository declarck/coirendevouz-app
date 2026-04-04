import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { MainLayout } from 'src/layouts/main';

import { SplashScreen } from 'src/components/loading-screen';

import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { careerRoutes } from './career';
import { travelRoutes } from './travel';
import { accountRoutes } from './account';
import { marketingRoutes } from './marketing';
import { eLearningRoutes } from './elearning';
import { eCommerceRoutes } from './ecommerce';
import { componentsRoutes } from './components';

// ----------------------------------------------------------------------

const HomePage = lazy(() => import('src/pages/home'));
const Page404 = lazy(() => import('src/pages/error/404'));

export const routesSection: RouteObject[] = [
  {
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <MainLayout
            slotProps={{
              header: {
                sx: { position: { md: 'fixed' } },
              },
            }}
          >
            <HomePage />
          </MainLayout>
        ),
      },

      // Main
      ...mainRoutes,

      // Auth
      ...authRoutes,

      // Marketing
      ...marketingRoutes,

      // Travel
      ...travelRoutes,

      // Career
      ...careerRoutes,

      // E-learning
      ...eLearningRoutes,

      // E-commerce
      ...eCommerceRoutes,

      // Account
      ...accountRoutes,

      // Demo components
      ...componentsRoutes,

      // No match
      { path: '*', element: <Page404 /> },
    ],
  },
];
