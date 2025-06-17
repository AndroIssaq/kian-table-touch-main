import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { isTokenValidToday, getStatusColor } from '@/lib/utils'

// --- Main Component ---
const VerificationCode: React.FC = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const table = new URLSearchParams(location.search).get('table')

    const [code, setCode] = useState<string>('')
    const [status, setStatus] = useState<VerificationStatus>('idle')
    const [statusMessage, setStatusMessage] = useState<string>('')

    // On mount: check if a valid verification token exists for today
    useEffect(() => {
        const token = localStorage.getItem('verificationToken')
        if (isTokenValidToday(token)) {
            const targetPath = table
                ? `/user-home?table=${table}`
                : '/choose-table'
            const currentPath =
                window.location.pathname + window.location.search
            if (currentPath !== targetPath) {
                navigate(targetPath, { state: { verificationToken: token } })
            }
        } else if (token) {
            localStorage.removeItem('verificationToken')
        }
    }, [navigate, table])

    // If no table param, redirect to choose-table
    // Uncomment the following lines if you want to enforce a table selection
    // This is optional and can be removed if you want to allow verification without a table.
    // useEffect(() => {
    //   if (!table) {
    //     navigate('/choose-table', { replace: true });
    //   }
    // }, [table, navigate]);

    // Handle input change
    const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCode(e.target.value)
    }

    // Handle verification logic
    const handleVerify = async () => {
        if (!code.trim()) {
            setStatus('error')
            setStatusMessage('برجاء ادخال الكود المخصص لهذا اليوم')
            return
        }
        try {
            setStatus('loading')
            setStatusMessage('جاري التأكد من الكود ')
            const { data, error } = await supabase
                .from('daily_codes')
                .select('*')
                .eq('code', code)
                .order('created_at', { ascending: false })
                .limit(1)
            if (error || !data || data.length === 0) {
                setStatus('error')
                setStatusMessage(
                    'هذا الكود غير صالح او انتهي صلاحيته برجاء طلب من النادل الكود المخصص لهذا اليوم للحصول علي نقطة '
                )
                return
            }
            const dailyCode = data[0]
            const now = new Date()
            const validUntil = new Date(dailyCode.valid_until)
            if (now > validUntil) {
                setStatus('error')
                setStatusMessage(
                    'لقد انتهت صلاحية هذا الكود اطلب من النادل الكود المخصص لهذا اليوم للحصول علي نقطة '
                )
                return
            }
            setStatus('success')
            setStatusMessage('تم التأكد من الكود بنجاح')
            localStorage.setItem(
                'verificationToken',
                `verified-${code}-${now.getTime()}`
            )
            setTimeout(() => {
                if (table) {
                    navigate(`/user-home?table=${table}`)
                } else {
                    navigate('/choose-table')
                }
            }, 1500)
        } catch (err) {
            setStatus('error')
            setStatusMessage('حدث خطأ أثناء التحقق، حاول مرة أخرى')
            // eslint-disable-next-line no-console
            console.error('Verification error:', err)
        }
    }

    // --- Render ---
    return (
        <div className='flex items-center justify-center min-h-screen bg-muted'>
            <Card className='w-full max-w-md'>
                <CardHeader>
                    <CardTitle className='text-center text-2xl font-bold'>
                        التحقق من الرمز اليومي
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(e: FormEvent<HTMLFormElement>) => {
                            e.preventDefault()
                            handleVerify()
                        }}
                        className='space-y-6'
                    >
                        <div className='space-y-2'>
                            <Label htmlFor='code' className='block text-right'>
                                أدخل الرمز اليومي
                            </Label>
                            <Input
                                id='code'
                                type='text'
                                value={code}
                                onChange={handleCodeChange}
                                disabled={
                                    status === 'loading' || status === 'success'
                                }
                                className='text-right'
                                placeholder='رمز اليوم'
                                autoFocus
                            />
                        </div>
                        <Button
                            type='submit'
                            className='w-full'
                            disabled={
                                status === 'loading' || status === 'success'
                            }
                        >
                            {status === 'loading' ? 'جاري التحقق' : 'تحقق'}
                        </Button>
                        {statusMessage && (
                            <div
                                className={`mt-2 text-center font-bold ${getStatusColor()}`}
                            >
                                {statusMessage}
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default VerificationCode
