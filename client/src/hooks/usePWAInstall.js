import { useContext } from 'react';
import { PWAContext } from '@/context/pwa-context';

export function usePWAInstall() {
  return useContext(PWAContext);
}
