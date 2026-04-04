'use client';

import { ComponentLayout } from '../layout';
import { DemoMegaMenuMobile } from './mobile';
import { DemoMegaMenuVertical } from './vertical';
import { DemoMegaMenuHorizontal } from './horizontal';

// ----------------------------------------------------------------------

export function MegaMenuView() {
  return (
    <ComponentLayout
      heroProps={{
        heading: 'Mega menu',
        bottomNode: <DemoMegaMenuHorizontal />,
      }}
      containerProps={{ maxWidth: 'lg' }}
    >
      <DemoMegaMenuMobile />
      <DemoMegaMenuVertical />
    </ComponentLayout>
  );
}
