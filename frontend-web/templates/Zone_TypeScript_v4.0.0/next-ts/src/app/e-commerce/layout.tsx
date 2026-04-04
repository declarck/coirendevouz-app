import { MainLayout } from 'src/layouts/main';

import { EcommerceLayout } from 'src/sections/_ecommerce/layout';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <MainLayout>
      <EcommerceLayout>{children}</EcommerceLayout>
    </MainLayout>
  );
}
