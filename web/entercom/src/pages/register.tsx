import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { requestsApi } from '../api/requests';
import { apiClient } from '../api/axios';
import logo from '../assets/logo.png';

const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Extract request data if navigating from QuoteForm
  const state = location.state as { requestData?: any };
  const requestData = state?.requestData;
  
  // Try to parse full name if available
  const fullName = requestData?.user_name || '';
  const nameParts = fullName.split(' ');
  const defaultFirstName = nameParts[0] || '';
  const defaultLastName = nameParts.slice(1).join(' ') || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: defaultFirstName,
      last_name: defaultLastName,
      email: requestData?.user_email || '',
      phone_number: requestData?.user_phone || '',
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      // 1. Register User
      const response = await authApi.register(data);
      
      // Show OTP screen
      setShowOtp(true);
    } catch (error: any) {
      if (error.response?.status === 400 || error.response?.status === 403) {
        setServerError(error.response?.data?.detail || error.response?.data?.message || 'Validation error. Please check your inputs.');
      } else if (!error.response) {
        setServerError('Network failure. Please check your connection.');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleVerifyOtp = async () => {
    setServerError(null);
    setIsVerifying(true);
    try {
      await authApi.verifyEmail(otp);
      
      // Navigate to login after successful verification
      navigate('/login', { state: { message: 'Email verified successfully. Please log in to complete your request.', requestData } });
    } catch (error: any) {
      setServerError(error.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (showOtp) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-lg rounded-xl text-center">
          <div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Verify Your Email</h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a 6-digit OTP to your email address. Please enter it below.
            </p>
          </div>
          {serverError && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-700">{serverError}</div>
            </div>
          )}
          <div className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="block w-full rounded-md border border-gray-300 p-3 text-center text-2xl tracking-widest shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={isVerifying || otp.length !== 6}
              className="w-full flex justify-center rounded-md border border-transparent bg-ess-purple py-2.5 px-4 text-sm font-bold text-white hover:bg-ess-darkPurple focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-md"
            >
              {isVerifying ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            Create an Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {requestData 
              ? "Complete registration to track your service request."
              : "Entercom Security Systems Portal"}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {serverError && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-700">{serverError}</div>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  {...register('first_name')}
                  disabled={isSubmitting}
                  className={`block w-full rounded-md border p-2.5 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors ${
                    errors.first_name ? 'border-red-300' : 'border-gray-300'
                  } disabled:bg-gray-100 disabled:text-gray-500`}
                />
                {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  {...register('last_name')}
                  disabled={isSubmitting}
                  className={`block w-full rounded-md border p-2.5 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors ${
                    errors.last_name ? 'border-red-300' : 'border-gray-300'
                  } disabled:bg-gray-100 disabled:text-gray-500`}
                />
                {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                {...register('email')}
                disabled={isSubmitting}
                className={`block w-full rounded-md border p-2.5 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } disabled:bg-gray-100 disabled:text-gray-500`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                {...register('phone_number')}
                disabled={isSubmitting}
                className={`block w-full rounded-md border p-2.5 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors ${
                  errors.phone_number ? 'border-red-300' : 'border-gray-300'
                } disabled:bg-gray-100 disabled:text-gray-500`}
              />
              {errors.phone_number && <p className="mt-1 text-xs text-red-600">{errors.phone_number.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className={`block w-full rounded-md border p-2.5 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
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
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-ess-purple py-2.5 px-4 text-sm font-bold text-white hover:bg-ess-darkPurple focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]"
            >
              {isSubmitting ? 'Creating Account...' : (requestData ? 'Register & Track Request' : 'Create Account')}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')} 
              className="font-medium text-ess-purple hover:text-ess-darkPurple"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
