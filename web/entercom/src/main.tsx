import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { ToastContainer } from './shared/components/ui/ToastContainer';
import { AppPreloader } from './components/system/AppPreloader';
import { AlertPopup } from './components/ui/AlertPopup';
import { useAlertStore } from './store/alertStore';
import './index.css';

declare global {
  interface Window {
    showAppAlert: (message: string, type?: 'success' | 'error' | 'pending' | 'cancel' | 'info') => void;
  }
}

window.showAppAlert = (message: string, type: 'success' | 'error' | 'pending' | 'cancel' | 'info' = 'info') => {
  useAlertStore.getState().showAlert({ message, type });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <AppPreloader />
          <RouterProvider router={router} />
          <ToastContainer />
          <AlertPopup />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  </StrictMode>
);