import { ZONE_COLORS } from '@mtll/shared';

/** Màu của app, cùng bộ nhận diện với web quản trị. */
export const colors = {
  bg: '#F2F0F6',
  surface: '#FFFFFF',
  ink: '#1F1A33',
  muted: '#605A75',
  line: '#DCD7E6',
  accent: '#C97A06',
  accentSoft: '#FBE8C7',
  accentInk: '#7A4700',
  good: '#1F7A4D',
  goodSoft: '#DCF1E5',
  walk: '#E7E3EE',
  water: '#CFE0EE',
  zone: ZONE_COLORS,
};

export const radius = { sm: 8, md: 12, lg: 16 };
export const space = (n: number) => n * 4;
