const PATTERNS = { light: 10, medium: 20, heavy: 30 };

export function haptic(style = 'light') {
  if (navigator.vibrate) navigator.vibrate(PATTERNS[style] || 10);
}
