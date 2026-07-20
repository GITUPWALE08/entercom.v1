import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import logo from '../assets/logo.png';

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RequestFormValues = z.infer<typeof requestSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: requestErrors, isSubmitting: isSubmittingRequest },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors, isSubmitting: isSubmittingReset },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onRequestSubmit = async (data: RequestFormValues) => {
    setServerError(null);
    setServerSuccess(null);
    try {
      await authApi.requestPasswordReset(data.email);
      setEmail(data.email);
      setStep('reset');
      setServerSuccess('If an account with that email exists, we have sent a 6-digit OTP.');
    } catch (error: any) {
      setServerError(error.response?.data?.detail || 'An unexpected error occurred. Please try again.');
    }
  };

  const onResetSubmit = async (data: ResetFormValues) => {
    setServerError(null);
    try {
      await authApi.resetPassword({
        email,
        otp: data.otp,
        new_password: data.new_password,
      });
      navigate('/login', { state: { message: 'Password has been reset successfully. Please log in.' } });
    } catch (error: any) {
      setServerError(error.response?.data?.detail || 'Invalid or expired OTP. Please try again.');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-lg rounded-xl">
        <div>
          <div className="flex justify-center">
             <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
               <img 
                    src={logo} 
                    alt="ESS Logo" 
                    className="w-10 h-10 md:w-12 md:h-12 object-contain" 
                  />
             </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset your password
          </h2>
        </div>

        {serverError && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="text-sm text-red-700">{serverError}</div>
          </div>
        )}
        
        {serverSuccess && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <div className="text-sm text-green-700">{serverSuccess}</div>
          </div>
        )}

        {step === 'request' ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmitRequest(onRequestSubmit)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  {...registerRequest('email')}
                  disabled={isSubmittingRequest}
                  placeholder="you@example.com"
                  className={`block w-full rounded-md border p-2.5 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors ${
                    requestErrors.email ? 'border-red-300' : 'border-gray-300'
                  } disabled:bg-gray-100 disabled:text-gray-500`}
                />
                {requestErrors.email && <p className="mt-1 text-xs text-red-600">{requestErrors.email.message}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]"
              >
                {isSubmittingRequest ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmitReset(onResetSubmit)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit OTP</label>
                <input
                  type="text"
                  {...registerReset('otp')}
                  disabled={isSubmittingReset}
                  placeholder="123456"
                  maxLength={6}
                  className={`block w-full rounded-md border p-2.5 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors text-center tracking-widest text-xl ${
                    resetErrors.otp ? 'border-red-300' : 'border-gray-300'
                  } disabled:bg-gray-100 disabled:text-gray-500`}
                />
                {resetErrors.otp && <p className="mt-1 text-xs text-red-600">{resetErrors.otp.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...registerReset('new_password')}
                    disabled={isSubmittingReset}
                    placeholder="••••••••"
                    className={`block w-full rounded-md border p-2.5 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors ${
                      resetErrors.new_password ? 'border-red-300' : 'border-gray-300'
                    } disabled:bg-gray-100 disabled:text-gray-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {resetErrors.new_password && <p className="mt-1 text-xs text-red-600">{resetErrors.new_password.message}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmittingReset}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]"
              >
                {isSubmittingReset ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800/50 flex justify-center items-center text-[15px] text-slate-500 font-bold uppercase tracking-widest">
          <Link to="/login" className="hover:text-ec-cyan transition-colors">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
