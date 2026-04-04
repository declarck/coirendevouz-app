import type { ReactPlayerProps } from 'react-player';

import { ReactPlayerRoot } from './styles';

// ----------------------------------------------------------------------

// https://github.com/CookPete/react-player

export function Player({ ...other }: ReactPlayerProps) {
  return <ReactPlayerRoot {...other} />;
}
