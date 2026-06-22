import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Robust global error listing for mobile and production environment debugging
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Captured Global Error:', { message, source, lineno, colno, error });
  // Trace error message to console to help developers using Remote Devices or Vercel logs
  if (error instanceof Error && error.stack) {
    console.error('Error stack:', error.stack);
  }
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('Captured Unhandled Promise Rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

