import logo from '../../assets/logo.png';

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center bg-transparent transition-opacity duration-300">
      <div className="relative flex flex-col items-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-ess-purple rounded-2xl flex items-center justify-center text-white shadow-xl animate-pulse mb-6 relative overflow-hidden">
           <img 
              src={logo} 
              alt="ESS Logo" 
              className="w-10 h-10 md:w-12 md:h-12 object-contain relative z-10" 
           />
           {/* Shimmer effect */}
           <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>
        <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
          <svg className="animate-spin h-4 w-4 text-ess-purple/80" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {message}
        </div>
      </div>
    </div>
  );
}
