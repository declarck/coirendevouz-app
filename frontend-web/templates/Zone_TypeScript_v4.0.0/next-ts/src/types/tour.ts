import type { DatePickerFormat } from 'src/utils/format-time';

import type { IAuthorProps } from './author';
import type { ISocialLinks } from './socials';

// ----------------------------------------------------------------------

export type ITourProps = {
  id: string;
  slug: string;
  price: number;
  heroUrl: string;
  coverUrl: string;
  location: string;
  duration: string;
  continent: string;
  priceSale: number;
  gallery: string[];
  favorited: boolean;
  services: string[];
  description: string;
  languages: string[];
  ratingNumber: number;
  totalReviews: number;
  highlights: string[];
  createdAt: DatePickerFormat;
  tourGuide?: IAuthorProps;
  shareLinks: ISocialLinks;
  available: {
    start: DatePickerFormat;
    end: DatePickerFormat;
  };
  program: {
    label: string;
    text: string;
  }[];
};
