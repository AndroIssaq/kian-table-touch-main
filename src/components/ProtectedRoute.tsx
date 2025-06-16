import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    // التحقق من وجود رمز تحقق صالح
    const token = localStorage.getItem('verificationToken');
    if (!token) {
      setIsVerified(false);
      return;
    }

    // استخراج التاريخ من الرمز
    const parts = token.split('-');
    const timestamp = parts.length > 2 ? Number(parts[2]) : null;
    
    if (!timestamp) {
      setIsVerified(false);
      return;
    }

    const tokenDate = new Date(timestamp);
    const now = new Date();
    
    // تحقق إذا كان الرمز لنفس اليوم
    if (
      tokenDate.getFullYear() === now.getFullYear() &&
      tokenDate.getMonth() === now.getMonth() &&
      tokenDate.getDate() === now.getDate()
    ) {
      setIsVerified(true);
    } else {
      // إذا كان الرمز ليوم قديم، احذفه
      localStorage.removeItem('verificationToken');
      setIsVerified(false);
    }
  }, []);

  // عرض شاشة تحميل أثناء التحقق
  if (isVerified === null) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }

  // إعادة التوجيه إلى صفحة التحقق إذا لم يكن هناك رمز صالح
  if (!isVerified) {
    return <Navigate to="/" replace />;
  }

  // السماح بعرض المحتوى إذا كان الرمز صالحاً
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
};

export default ProtectedRoute;