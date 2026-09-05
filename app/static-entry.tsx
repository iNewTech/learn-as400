import React from 'react';
import { createRoot } from 'react-dom/client';
import StudyApp from './study-app';
import './globals.css';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StudyApp />
  </React.StrictMode>,
);
