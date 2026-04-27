import { useState, useEffect } from 'react';

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useTypewriter(words, { typeSpeed = 65, deleteSpeed = 38, pauseMs = 1600 } = {}) {
  const [text, setText] = useState(words[0]);
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;

    const target = words[wordIndex];

    if (!isDeleting && text === target) {
      const t = setTimeout(() => setIsDeleting(true), pauseMs);
      return () => clearTimeout(t);
    }

    if (isDeleting && text === '') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDeleting(false);
      setWordIndex(i => (i + 1) % words.length);
      return;
    }

    const delay = isDeleting ? deleteSpeed : typeSpeed;
    const next = isDeleting
      ? target.slice(0, text.length - 1)
      : target.slice(0, text.length + 1);

    const t = setTimeout(() => setText(next), delay);
    return () => clearTimeout(t);
  }, [text, isDeleting, wordIndex, words, typeSpeed, deleteSpeed, pauseMs]);

  return text;
}
