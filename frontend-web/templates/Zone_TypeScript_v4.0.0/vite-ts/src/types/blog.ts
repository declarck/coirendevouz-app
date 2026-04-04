import type { DatePickerFormat } from 'src/utils/format-time';

import type { IAuthorProps } from './author';
import type { ISocialLinks } from './socials';

// ----------------------------------------------------------------------

export type IPostCategoryProps = {
  label: string;
  path: string;
};

export type IPostProps = {
  id: string;
  title: string;
  heroUrl: string;
  tags?: string[];
  content: string;
  category: string;
  coverUrl: string;
  duration: string;
  favorited: boolean;
  description: string;
  author: IAuthorProps;
  createdAt: DatePickerFormat;
  shareLinks?: ISocialLinks;
};
