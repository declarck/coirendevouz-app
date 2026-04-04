import { MainLayout } from 'src/layouts/main';

import { AccountLayout } from 'src/sections/_account/layout';
import { EcommerceLayout } from 'src/sections/_ecommerce/layout';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <MainLayout>
      <EcommerceLayout>
        <AccountLayout>{children}</AccountLayout>
      </EcommerceLayout>
    </MainLayout>
  );
}
