import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

export function RouteError() {
  const error = useRouteError();
  
  let title = "Oops!";
  let message = "Sorry, an unexpected error has occurred.";
  let isChunkLoadError = false;
  
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "404 Not Found";
      message = "The page you are looking for doesn't exist or has been moved.";
    } else if (error.status === 401) {
      title = "Unauthorized";
      message = "You aren't authorized to see this.";
    } else if (error.status === 503) {
      title = "Service Unavailable";
      message = "Looks like our API is down";
    }
  } else if (error instanceof Error) {
    if (error.message.includes('Failed to fetch dynamically imported module') || error.message.includes('Importing a module script failed')) {
      isChunkLoadError = true;
      title = "Update Available";
      message = "A new version of the application is available. Please refresh to continue.";
    } else {
      message = error.message;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 shadow-lg rounded-xl text-center">
        <div>
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${isChunkLoadError ? 'bg-blue-100' : 'bg-red-100'}`}>
            {isChunkLoadError ? (
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-500">{message}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          {isChunkLoadError ? (
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Refresh Page
            </button>
          ) : (
            <Link
              to="/"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go back home
            </Link>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isChunkLoadError ? "Go to Home" : "Reload Page"}
          </button>
        </div>
      </div>
    </div>
  );
}
