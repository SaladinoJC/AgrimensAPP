import { useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme'; 
import { paletas } from '@/theme/themes';

type ThemeColors = typeof paletas.dark;

export const useStyles = <T extends object>(styleFactory: (colores: ThemeColors) => T) => {
  const { colores } = useTheme(); 

  return useMemo(() => styleFactory(colores), [colores, styleFactory]);
};