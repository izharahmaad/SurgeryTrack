import { DefaultTheme } from 'react-native-paper';
import { COLORS } from './constants';

export const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    accent: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.surface,
    text: COLORS.text,
    placeholder: COLORS.textMuted,
    disabled: COLORS.border,
    error: COLORS.error,
  },
};