import { create } from 'zustand';

export type AlertType = 'success' | 'error' | 'pending' | 'cancel' | 'info';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  buttons?: AlertButton[];
  showAlert: (options: { type?: AlertType; title?: string; message: string; buttons?: AlertButton[] }) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  isOpen: false,
  type: 'info',
  title: '',
  message: '',
  buttons: [],
  showAlert: (options) => set({
    isOpen: true,
    type: options.type || 'info',
    title: options.title || '',
    message: options.message,
    buttons: options.buttons
  }),
  hideAlert: () => set({ isOpen: false })
}));
