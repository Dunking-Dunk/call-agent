import { useQueryData } from "@/hooks/useQueryData";
import { useMutationData } from "@/hooks/useMutationData";
import axios from "axios";
import { LoginRequest, PasswordResetRequest, RegisterRequest, ResendVerificationRequest, ResetPasswordRequest } from "@/types/index.types";

const API_URL = 'http://localhost:4001/api';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// API functions

// Register user
  export const useRegisterUser = (onSuccess?: () => void) => {
    return useMutationData(
      ['register'],
      async (data: RegisterRequest) => {
      try {
        const response = await api.post('/auth/register', data);
        return {
          status: response.status,
          data: response.data.message,
          userId: response.data.userId,
        };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return {
            status: error.response.status,
            data: error.response.data.message || 'Registration failed',
          };
        }
        throw error;
      }
    },
    'users',
    onSuccess
  );
};

// Verify email
export const useVerifyEmail = () => {
  return (token: string) => {
    return useQueryData(
      ['verifyEmail', token],
      async () => {
        try {
          const response = await api.get(`/auth/verify/${token}`);
          return response.data;
        } catch (error) {
          if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Verification failed');
          }
          throw error;
        }
      }
    );
  };
};

// Login user
export const useLoginUser = (onSuccess?: () => void) => {
  return useMutationData(
    ['login'],
    async (data: LoginRequest) => {
      try {
        const response = await api.post('/auth/login', data);
        
        // Store token in localStorage (for backward compatibility)
        localStorage.setItem('authToken', response.data.token);
        
        // Store user info
        localStorage.setItem('user', JSON.stringify({
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          isVerified: response.data.user.isVerified,
        }));
        
        return {
          status: response.status,
          data: response.data.message,
          user: response.data.user,
        };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return {
            status: error.response.status,
            data: error.response.data.message || 'Login failed',
          };
        }
        throw error;
      }
    },
    'currentUser',
    onSuccess
  );
};

// Request password reset
export const useRequestPasswordReset = (onSuccess?: () => void) => {
  return useMutationData(
    ['requestPasswordReset'],
    async (data: PasswordResetRequest) => {
      try {
        const response = await api.post('/auth/forgot-password', data);
        return {
          status: response.status,
          data: response.data.message,
        };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return {
            status: error.response.status,
            data: error.response.data.message || 'Password reset request failed',
          };
        }
        throw error;
      }
    },
    undefined,
    onSuccess
  );
};

// Reset password
export const useResetPassword = (token: string, onSuccess?: () => void) => {
  return useMutationData(
    ['resetPassword', token],
    async (data: ResetPasswordRequest) => {
      try {
        const response = await api.post(`/auth/reset-password/${token}`, data);
        return {
          status: response.status,
          data: response.data.message,
        };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return {
            status: error.response.status,
            data: error.response.data.message || 'Password reset failed',
          };
        }
        throw error;
      }
    },
    undefined,
    onSuccess
  );
};

// Resend verification email
export const useResendVerification = (onSuccess?: () => void) => {
  return useMutationData(
    ['resendVerification'],
    async (data: ResendVerificationRequest) => {
      try {
        const response = await api.post('/auth/resend-verification', data);
        return {
          status: response.status,
          data: response.data.message,
        };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return {
            status: error.response.status,
            data: error.response.data.message || 'Failed to resend verification email',
          };
        }
        throw error;
      }
    },
    undefined,
    onSuccess
  );
};

// Check if user is logged in
export const useCurrentUser = () => {
  return useQueryData(
    ['currentUser'],
    async () => {
      try {
        // Attempt to get current user from the cookie-based endpoint
        const response = await api.get('/auth/current-user');
        return response.data.user;
      } catch (cookieError) {
        // If cookie-based auth fails, try token-based auth as fallback
        try {
          // Check if we have a token
          const token = localStorage.getItem('authToken');
          if (!token) return null;
          
          // Try to verify token is valid
          const tokenResponse = await api.get('/auth/me');
          return tokenResponse.data.user;
        } catch (tokenError) {
          // If both auth methods fail, clear token and user info
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          return null;
        }
      }
    }
  );
};

// Logout user
export const useLogout = (onSuccess?: () => void) => {
  return useMutationData(
    ['logout'],
    async () => {
      try {
        // Call logout endpoint to clear cookie
        const response = await api.post('/auth/logout');
        
        // Clear localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        return {
          status: response.status,
          data: response.data.message,
        };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return {
            status: error.response.status,
            data: error.response.data.message || 'Logout failed',
          };
        }
        throw error;
      }
    },
    'currentUser',
    onSuccess
  );
};
