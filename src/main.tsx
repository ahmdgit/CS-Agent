import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppContextProvider } from './contexts/AppContext';
import { BrandingProvider } from './config/branding';
import './index.css';

const originalSetItem = window.localStorage.setItem;
window.localStorage.setItem = function(key, value) {
  try {
    originalSetItem.call(this, key, value);
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrandingProvider>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </BrandingProvider>
  </StrictMode>,
);
