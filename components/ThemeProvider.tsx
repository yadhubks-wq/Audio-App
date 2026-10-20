import { createContext, useContext, useMemo, ReactNode } from 'react';
import { ThemeMode } from '@/types';
import { COLORS } from '@/constants';

type ThemeColors = (typeof COLORS)[ThemeMode];

const ThemeContext = createContext<{
  theme: ThemeMode;
  colors: ThemeColors;
}>({
  theme: 'dark',
  colors: COLORS.dark,
});

export function ThemeProvider({
  theme,
  children,
}: {
  theme: ThemeMode;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ theme, colors: COLORS[theme] }),
    [theme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
