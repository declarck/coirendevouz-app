import type { IPostProps } from 'src/types/blog';
import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { Image } from 'src/components/image';

import { PostTime } from '../../blog/post-time';

// ----------------------------------------------------------------------

type Props = BoxProps & {
  post: IPostProps;
};

export function ElearningFeaturedPost({ post, sx, ...other }: Props) {
  return (
    <Box
      component="section"
      sx={[{ py: 10, bgcolor: 'background.neutral' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <Container>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          <Image
            src={post.coverUrl}
            alt={post.title}
            sx={{ flexGrow: 1, height: 560, borderRadius: 2 }}
          />

          <Stack
            spacing={1}
            sx={{ mx: 'auto', pl: { md: 8 }, py: { xs: 3, md: 5 }, maxWidth: { md: 408 } }}
          >
            <PostTime createdAt={fDate(post.createdAt)} duration={post.duration} />

            <Link component={RouterLink} href={paths.eLearning.post} color="inherit" variant="h3">
              {post.title}
            </Link>

            <Typography sx={{ color: 'text.secondary', flexGrow: 1 }}>
              {post.description}
            </Typography>

            <Box
              sx={{ gap: 1.5, display: 'flex', alignItems: 'center', pt: 1.5, typography: 'body2' }}
            >
              <Avatar src={post.author.avatarUrl} />
              {post.author.name}
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
