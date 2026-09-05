import React from 'react';
import { createRoot } from 'react-dom/client';
import StudyApp from './study-app';
import './globals.css';

const clarityWindow = window as Window & {
  clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
};
clarityWindow.clarity =
  clarityWindow.clarity || ((...args: unknown[]) => {
    (clarityWindow.clarity!.q ||= []).push(args);
  });
const clarityScript = document.createElement('script');
clarityScript.async = true;
clarityScript.src = 'https://www.clarity.ms/tag/ydjtfhzlxj';
document.head.appendChild(clarityScript);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StudyApp />
  </React.StrictMode>,
);
