import type { ICourseLessonProp } from 'src/types/course';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import { Player } from 'src/components/player';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  playing: boolean;
  onPlay: () => void;
  onClose: () => void;
  onReady: () => void;
  onEnded: () => void;
  onPause: () => void;
  lessons: ICourseLessonProp[];
  selectedLesson: ICourseLessonProp | null;
  onSelectedLesson: (lesson: ICourseLessonProp) => void;
};

export function ElearningCourseDetailsLessonsDialog({
  open,
  onPlay,
  lessons,
  onClose,
  playing,
  onReady,
  onEnded,
  onPause,
  selectedLesson,
  onSelectedLesson,
}: Props) {
  const renderVideo = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        width: { xs: 1, md: 0.5 },
        height: { xs: 320, md: 640 },
      }}
    >
      {selectedLesson?.videoPath ? (
        <Player
          controls
          url={selectedLesson?.videoPath}
          playing={playing}
          onReady={onReady}
          onEnded={onEnded}
          onPlay={onPlay}
          onPause={onPause}
        />
      ) : (
        <Box
          sx={{
            width: 1,
            height: 1,
            display: 'flex',
            typography: 'h6',
            alignItems: 'center',
            color: 'text.disabled',
            flexDirection: 'column',
            justifyContent: 'center',
            bgcolor: 'background.neutral',
          }}
        >
          No Data
        </Box>
      )}
    </Box>
  );

  const renderList = () => (
    <Box
      sx={{
        p: 1,
        gap: 0.5,
        display: 'flex',
        overflowY: 'scroll',
        flexDirection: 'column',
        width: { xs: 1, md: 0.5 },
        height: { xs: 320, md: 640 },
      }}
    >
      {lessons?.map((lesson) => {
        const selected = selectedLesson?.id === lesson.id;
        const playIcon = selected ? 'solar:pause-circle-outline' : 'solar:play-outline';

        return (
          <ListItemButton
            key={lesson.id}
            selected={selected}
            disabled={!lesson.unLocked}
            onClick={() => onSelectedLesson(lesson)}
            sx={{ borderRadius: 1 }}
          >
            <Iconify
              width={24}
              icon={!lesson.unLocked ? 'solar:lock-password-outline' : playIcon}
              sx={{
                mr: 2,
                ...(selected && { color: 'primary.main' }),
                ...(!lesson.unLocked && { color: 'text.disabled' }),
              }}
            />

            <ListItemText
              primary={lesson.title}
              secondary={lesson.description}
              slotProps={{
                primary: {
                  noWrap: true,
                  sx: { typography: 'subtitle1', ...(selected && { color: 'primary.main' }) },
                },
                secondary: { noWrap: true },
              }}
            />
          </ListItemButton>
        );
      })}
    </Box>
  );

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            overflow: 'hidden',
          },
        },
      }}
    >
      <IconButton onClick={onClose} sx={{ top: 8, left: 8, zIndex: 9, position: 'absolute' }}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>

      <Box
        sx={{
          height: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {renderVideo()}
        {renderList()}
      </Box>
    </Dialog>
  );
}
