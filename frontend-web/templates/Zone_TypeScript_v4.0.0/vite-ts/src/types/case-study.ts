import type { DatePickerFormat } from 'src/utils/format-time';

import type { ISocialLinks } from './socials';

// ----------------------------------------------------------------------

export type ICaseStudyProps = {
  id: string;
  title: string;
  heroUrl: string;
  website: string;
  content: string;
  category: string;
  coverUrl: string;
  description: string;
  createdAt: DatePickerFormat;
  galleryImgs: string[];
  socialLinks?: ISocialLinks;
};
