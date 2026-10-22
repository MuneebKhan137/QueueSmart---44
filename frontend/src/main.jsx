import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { ServiceProvider } from './context/ServiceContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ServiceProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </ServiceProvider>
    </BrowserRouter>
  </StrictMode>
);
