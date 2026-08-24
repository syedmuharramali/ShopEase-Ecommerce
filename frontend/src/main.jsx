import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { installProductImageOptimization } from './utils/optimizeApiImages.js'

installProductImageOptimization();

const loadClarity = () => {
  if (window.clarity) return;

  window.clarity = (...args) => {
    window.clarity.q = window.clarity.q || [];
    window.clarity.q.push(args);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.clarity.ms/tag/y3m4v3zoxt';
  document.head.appendChild(script);
};

const loadAnalytics = () => {
  import('@vercel/analytics')
    .then(({ inject }) => inject())
    .catch((error) => console.warn('Vercel Analytics could not load:', error));

  loadClarity();
};

const scheduleAnalytics = () => {
  window.setTimeout(() => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadAnalytics, { timeout: 2000 });
      return;
    }

    loadAnalytics();
  }, 3000);
};

if (import.meta.env.PROD) {
  if (document.readyState === 'complete') {
    scheduleAnalytics();
  } else {
    window.addEventListener('load', scheduleAnalytics, { once: true });
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
