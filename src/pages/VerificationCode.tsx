import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// حالات التحقق المختلفة
const VerificationCode: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const table = new URLSearchParams(location.search).get("table");

  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // تحقق عند تحميل الصفحة إذا كان هناك رمز تحقق صالح
  useEffect(() => {
    const token = localStorage.getItem('verificationToken');
    if (token) {
      const parts = token.split('-');
      const timestamp = parts.length > 2 ? Number(parts[2]) : null;
      if (timestamp) {
        const tokenDate = new Date(timestamp);
        const now = new Date();
        if (
          tokenDate.getFullYear() === now.getFullYear() &&
          tokenDate.getMonth() === now.getMonth() &&
          tokenDate.getDate() === now.getDate()
        ) {
          if (table) {
            navigate(`/user-home?table=${table}`, { state: { verificationToken: token } });
          } else {
            navigate('/choose-table', { state: { verificationToken: token } });
          }
        } else {
          localStorage.removeItem('verificationToken');
        }
      }
    }
  }, [navigate, table]);

  useEffect(() => {
    if (!table) {
      navigate("/choose-table", { replace: true });
      setStatus('error');
    }
  }, [table, navigate]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value);

  const handleVerify = async () => {
    if (!code.trim()) {
      setStatus('error');
      setStatusMessage('برجاء ادخال الكود المخصص لهذا اليوم');
      return;
    }
    try {
      setStatus('loading');
      setStatusMessage('جاري التأكد من الكود ');
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
      setStatus('success');
      setStatusMessage('تم التأكد من الكود بنجاح');
      localStorage.setItem('verificationToken', 'verified-' + code + '-' + now.getTime());
      setTimeout(() => {
        if (table) {
          navigate(`/user-home?table=${table}`);
        } else {
          navigate('/choose-table');
        }
      }, 1500);
    } catch (error) {
      setStatus('error');
      setStatusMessage('حدث خطأ أثناء التحقق، حاول مرة أخرى');
      console.error('Verification error:', error);
    }
  };

  const getStatusColor = () => {
    if (status === 'success') return 'text-green-600';
    if (status === 'error') return 'text-red-600';
    return 'text-gray-800';
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