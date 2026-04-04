import type { Theme, SxProps } from '@mui/material/styles';
import type { ButtonBaseProps } from '@mui/material/ButtonBase';

import { useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { useBusinessContext } from 'src/contexts/business/use-business-context';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

const mediaQuery = 'sm';

export function BusinessWorkspacePopover({ sx, ...other }: ButtonBaseProps) {
  const { businesses, selectedBusiness, setSelectedBusinessId } = useBusinessContext();
  const { open, anchorEl, onClose, onOpen } = usePopover();

  const handleSelect = useCallback(
    (id: number) => {
      setSelectedBusinessId(id);
      onClose();
    },
    [setSelectedBusinessId, onClose]
  );

  const buttonBg: SxProps<Theme> = {
    height: 1,
    zIndex: -1,
    opacity: 0,
    content: "''",
    borderRadius: 1,
    position: 'absolute',
    visibility: 'hidden',
    bgcolor: 'action.hover',
    width: 'calc(100% + 8px)',
    transition: (theme) =>
      theme.transitions.create(['opacity', 'visibility'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.shorter,
      }),
    ...(open && {
      opacity: 1,
      visibility: 'visible',
    }),
  };

  if (!selectedBusiness) {
    return null;
  }

  if (businesses.length <= 1) {
    return (
      <Box
        sx={[
          {
            py: 0.5,
            gap: { xs: 0.5, [mediaQuery]: 1 },
            display: 'inline-flex',
            alignItems: 'center',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <Avatar
          alt={selectedBusiness.name}
          sx={{ width: 28, height: 28, typography: 'caption', fontWeight: 'fontWeightBold' }}
        >
          {selectedBusiness.name.slice(0, 1).toUpperCase()}
        </Avatar>
        <Typography
          component="span"
          variant="subtitle2"
          noWrap
          sx={{ maxWidth: 200, display: { xs: 'none', [mediaQuery]: 'inline' } }}
        >
          {selectedBusiness.name}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <ButtonBase
        disableRipple
        onClick={onOpen}
        sx={[
          {
            py: 0.5,
            gap: { xs: 0.5, [mediaQuery]: 1 },
            '&::before': buttonBg,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        <Avatar
          alt={selectedBusiness.name}
          sx={{ width: 28, height: 28, typography: 'caption', fontWeight: 'fontWeightBold' }}
        >
          {selectedBusiness.name.slice(0, 1).toUpperCase()}
        </Avatar>

        <Box
          component="span"
          sx={{ typography: 'subtitle2', display: { xs: 'none', [mediaQuery]: 'inline-flex' } }}
        >
          {selectedBusiness.name}
        </Box>

        <Iconify width={16} icon="carbon:chevron-sort" sx={{ color: 'text.disabled' }} />
      </ButtonBase>

      <CustomPopover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        slotProps={{
          arrow: { placement: 'top-left' },
          paper: { sx: { mt: 0.5, ml: -1.55, width: 280 } },
        }}
      >
        <Scrollbar sx={{ maxHeight: 280 }}>
          <MenuList>
            {businesses.map((b) => (
              <MenuItem
                key={b.id}
                selected={b.id === selectedBusiness.id}
                onClick={() => handleSelect(b.id)}
                sx={{ height: 48 }}
              >
                <Avatar
                  alt={b.name}
                  sx={{ width: 28, height: 28, mr: 1, typography: 'caption', fontWeight: 'fontWeightBold' }}
                >
                  {b.name.slice(0, 1).toUpperCase()}
                </Avatar>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography noWrap variant="body2" fontWeight="fontWeightMedium">
                    {b.name}
                  </Typography>
                  <Typography noWrap variant="caption" color="text.secondary">
                    {[b.city, b.district].filter(Boolean).join(' · ')}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </MenuList>
        </Scrollbar>
      </CustomPopover>
    </>
  );
}
