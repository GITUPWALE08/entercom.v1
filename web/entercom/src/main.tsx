import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { ToastContainer } from './shared/components/ui/ToastContainer';
import { AppPreloader } from './components/system/AppPreloader';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <AppPreloader />
        <RouterProvider router={router} />
        <ToastContainer />
      </AuthProvider>
    </QueryProvider>
  </StrictMode>
);