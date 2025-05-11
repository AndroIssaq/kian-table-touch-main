import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';


// حالات التحقق المختلفة
type VerificationStatus = 'idle' | 'loading' | 'success' | 'error';

const VerificationCode: React.FC = () => {
  // متغيرات الحالة
  const [code, setCode] = useState<string>('');
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const navigate = useNavigate();

  // تحقق عند تحميل الصفحة إذا كان هناك رمز تحقق صالح
  useEffect(() => {
    const token = localStorage.getItem('verificationToken');
    if (token) {
      // استخراج التاريخ من الرمز (تم حفظ الوقت في الرمز)
      const parts = token.split('-');
      const timestamp = parts.length > 2 ? Number(parts[2]) : null;
      if (timestamp) {
        const tokenDate = new Date(timestamp);
        const now = new Date();
        // تحقق إذا كان الرمز لنفس اليوم
        if (
          tokenDate.getFullYear() === now.getFullYear() &&
          tokenDate.getMonth() === now.getMonth() &&
          tokenDate.getDate() === now.getDate()
        ) {
          navigate('/choose-table');
        } else {
          // إذا كان الرمز ليوم قديم، احذفه
          localStorage.removeItem('verificationToken');
        }
      }
    }
  }, [navigate]);

  // التعامل مع تغيير قيمة حقل الإدخال
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
  };

  // التعامل مع عملية التحقق
  const handleVerify = async () => {
    if (!code.trim()) {
      setStatus('error');
      setStatusMessage('برجاء ادخال الكود المخصص لهذا اليوم');
      return;
    }

    try {
      setStatus('loading');
      setStatusMessage('جاري التأكد من الكود ');

      // Query Supabase directly
      const { data, error } = await supabase
        .from('daily_codes')
        .select('*')
        .eq('code', code)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        setStatus('error');
        setStatusMessage('هذا الكود غير صالح او انتهي صلاحيته برجاء طلب من النادل الكود المخصص لهذا اليوم للحصول علي نقطة ');
        return;
      }

      const dailyCode = data[0];
      const now = new Date();
      const validUntil = new Date(dailyCode.valid_until);

      if (now > validUntil) {
        setStatus('error');
        setStatusMessage('لقد انتهت صلاحية هذا الكود اطلب من النادل الكود المخصص لهذا اليوم للحصول علي نقطة ');
        return;
      }

      // If code is valid and not expired
      setStatus('success');
      setStatusMessage('تم التأكد من الكود بنجاح');
      setVerificationToken('verified-' + code + '-' + now.getTime()); // You can generate a better token if needed

      localStorage.setItem('verificationToken', 'verified-' + code + '-' + now.getTime());

      setTimeout(() => {
        navigate('/choose-table');
      }, 1500);
    } catch (error) {
      setStatus('error');
      setStatusMessage('An error occurred during verification, please try again');
      console.error('Verification error:', error);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            التحقق من الرمز اليومي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleVerify();
            }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="code" className="block text-right">
                أدخل الرمز اليومي
              </Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={handleCodeChange}
                disabled={status === 'loading' || status === 'success'}
                className="text-right"
                placeholder="رمز اليوم"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={status === 'loading' || status === 'success'}
            >
              {status === 'loading' ? "جاري التحقق" : 'تحقق'}
            </Button>
            {statusMessage && (
              <div className={`mt-2 text-center font-bold ${getStatusColor()}`}>
                {statusMessage}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationCode;