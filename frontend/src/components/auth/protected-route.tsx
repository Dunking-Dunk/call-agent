import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useCurrentUser } from "@/action/user";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireVerified?: boolean;
}

export function ProtectedRoute({ children, requireVerified = true }: ProtectedRouteProps) {
  const location = useLocation();
  const { data: user, isPending }:{data:any, isPending:boolean} = useCurrentUser();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);
  if (isPending || isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  if (requireVerified && !user.isVerified) {
    return <Navigate to="/auth/verify-required" state={{ email: user.email }} replace />;
  }

  // Authentication and verification checks passed, render the protected component
  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { data: user, isPending } = useCurrentUser();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Add a small delay to avoid flash of loading state
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Still loading
  if (isPending || isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, render the public route
  return <>{children}</>;
} 