import { useStore } from '@/store/useStore';
import { paletas } from '@/theme/themes';

export const useTheme = () => {
  const theme = useStore((state) => state.theme);
  return { theme, colores: paletas[theme] };
};