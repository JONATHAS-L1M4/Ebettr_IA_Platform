
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { NotificationProvider } from './context/NotificationContext';
import { lightTheme, darkTheme } from './design-tokens';

// Inject Theme Tokens from design-tokens.ts directly into root styles
const rootEl = document.documentElement;

// 1. Apply Light Theme as the base
Object.entries(lightTheme).forEach(([key, value]) => {
  rootEl.style.setProperty(key, value);
});

// 2. Override ONLY Sidebar variables with Dark Theme values
Object.entries(darkTheme).forEach(([key, value]) => {
  if (key.startsWith('--sidebar')) {
    rootEl.style.setProperty(key, value);
  }
});


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);
