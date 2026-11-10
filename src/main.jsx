import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import { StoreProvider } from './state/store.jsx';
import { AvisosProvider } from './components/ui.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <AvisosProvider>
        <App />
      </AvisosProvider>
    </StoreProvider>
  </StrictMode>,
);
