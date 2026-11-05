import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';
import { initTheme } from './app/theme.ts';
import { requestPersistentStorage } from './pwa/persistence.ts';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

initTheme();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void requestPersistentStorage();
