import { createContext, useState, useEffect, useCallback } from 'react';

const PWAContext = createContext({ installPrompt: null, installed: false, prompt: () => Promise.resolve(false) });

export function PWAProvider({ children }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia?.('(display-mode: standalone)').matches ?? false,
  );

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallPrompt(e); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const prompt = useCallback(async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setInstalled(true);
    }
    return outcome === 'accepted';
  }, [installPrompt]);

  return (
    <PWAContext.Provider value={{ installPrompt, installed, prompt }}>
      {children}
    </PWAContext.Provider>
  );
}

export { PWAContext };
