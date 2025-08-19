// UI Types

interface Subspecialty {
  name: string;
  icon: string;
  gradient: string;
  description: string;
  avatar: string;
}

interface Department {
  name: string;
  icon: string;
  gradient: string;
  description: string;
  avatar: string;
  subspecialties?: Subspecialty[];
}

type Theme = 'light' | 'dark';
type ThemeSetting = Theme | 'system';

export type {
  Subspecialty,
  Department,
  Theme,
  ThemeSetting
};
