import { _courses } from 'src/_mock';
import { CONFIG } from 'src/global-config';

import { ElearningCourseView } from 'src/sections/_elearning/view/elearning-course-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Course details | E-learning - ${CONFIG.appName}` };

export default function Page() {
  return <ElearningCourseView course={_courses[1]} relatedCourses={_courses.slice(0, 3)} />;
}
