import type { SettingsState } from 'src/components/settings';
import type { Theme, Components } from '@mui/material/styles';

import type { ThemeOptions } from '../types';

// ----------------------------------------------------------------------

export function updateComponentsWithSettings(
  settingsState?: SettingsState
): Pick<ThemeOptions, 'components'> {
  const MuiCssBaseline: Components<Theme>['MuiCssBaseline'] = {
    styleOverrides: {
      html: {
        fontSize: settingsState?.fontSize,
      },
    },
  };

  return {
    components: {
      MuiCssBaseline,
    },
  };
}
