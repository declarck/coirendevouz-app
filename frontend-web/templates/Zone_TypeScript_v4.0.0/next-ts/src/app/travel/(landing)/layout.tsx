import { MainLayout } from 'src/layouts/main';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <MainLayout
      slotProps={{
        header: {
          sx: {
            position: { md: 'fixed' },
            color: { md: 'common.white' },
          },
        },
      }}
    >
      {children}
    </MainLayout>
  );
}
