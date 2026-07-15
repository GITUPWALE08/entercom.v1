import { Spinner } from './Spinner';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-inherit">
      <Spinner size="lg" />
      <p className="mt-4 text-sm font-semibold text-gray-700 animate-pulse">{message}</p>
    </div>
  );
}
