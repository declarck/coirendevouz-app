import { orderBy, kebabCase } from 'es-toolkit';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export type NavItemData = {
  name: string;
  href: string;
  icon: string;
};

const componentNames = [
  'Animate',
  'Carousel',
  'Utilities',
  'Form validation',
  'Form wizard',
  'Icons',
  'Image',
  'Label',
  'Lightbox',
  'Markdown',
  'Mega menu',
  'Navigation bar',
  'Scroll',
  'Scroll progress',
  'Player',
];

const createComponents = componentNames.map((name) => ({
  name,
  href: `/components/${kebabCase(name)}`,
  icon: `${CONFIG.assetsDir}/assets/icons/components/ic-${kebabCase(name)}.svg`,
}));

export const allComponents = orderBy(createComponents, ['name'], ['asc']);
