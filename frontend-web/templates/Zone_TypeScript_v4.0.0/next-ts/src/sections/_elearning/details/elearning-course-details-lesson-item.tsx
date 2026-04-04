import type { ICourseLessonProp } from 'src/types/course';

import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type LessonItemProps = {
  lesson: ICourseLessonProp;
  expanded: boolean;
  selected: boolean;
  onSelected: () => void;
  onExpanded: (event: React.SyntheticEvent, isExpanded: boolean) => void;
};

export function ElearningCourseDetailsLessonItem({
  lesson,
  expanded,
  selected,
  onSelected,
  onExpanded,
}: LessonItemProps) {
  const playIcon = selected ? 'solar:pause-circle-outline' : 'solar:play-outline';

  return (
    <Accordion expanded={expanded} onChange={onExpanded} disabled={!lesson.unLocked}>
      <AccordionSummary>
        <Box sx={{ display: 'flex', alignItems: 'center', width: 1 }}>
          <Iconify
            width={22}
            icon={!lesson.unLocked ? 'solar:lock-password-outline' : playIcon}
            onClick={onSelected}
            sx={{ mr: 2 }}
          />

          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            {lesson.title}
          </Typography>

          <Typography variant="body2">{lesson.duration} m</Typography>

          <Iconify
            width={16}
            icon={expanded ? 'carbon:chevron-down' : 'carbon:chevron-right'}
            sx={{ ml: 2 }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ typography: 'body2', color: 'text.secondary' }}>
        {lesson.description}
      </AccordionDetails>
    </Accordion>
  );
}
