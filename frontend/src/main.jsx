import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { inject } from "@vercel/analytics";
import './index.css'
import App from './App.jsx'
import { installProductImageOptimization } from './utils/optimizeApiImages.js'

inject();
installProductImageOptimization();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
