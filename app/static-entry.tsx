import React from 'react';
import { createRoot } from 'react-dom/client';
import StudyApp from './study-app';
import './globals.css';

// Defer analytics until the guide is interactive so it cannot compete with LCP.
const loadClarity = () => {
  const clarityWindow = window as Window & {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
  };
  clarityWindow.clarity = clarityWindow.clarity || ((...args: unknown[]) => {
    (clarityWindow.clarity!.q ||= []).push(args);
  });
  const clarityScript = document.createElement('script');
  clarityScript.async = true;
  clarityScript.src = 'https://www.clarity.ms/tag/ydjtfhzlxj';
  document.head.appendChild(clarityScript);
};
if ('requestIdleCallback' in window) window.requestIdleCallback(loadClarity, { timeout: 4000 });
else window.setTimeout(loadClarity, 2500);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined), { once: true });
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StudyApp />
  </React.StrictMode>,
);
