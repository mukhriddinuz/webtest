import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './i18n';
import { App } from './app/App';
import { getTelegram } from './lib/telegram';

// Resolve the host bridge before React mounts so `ready()` fires early.
getTelegram();

const container = document.getElementById('root');
if (!container) throw new Error('Root container is missing');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
