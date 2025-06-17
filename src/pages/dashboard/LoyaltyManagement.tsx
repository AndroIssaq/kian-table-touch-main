import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import PageTransition from '@/components/PageTransition'
import { useNavigate } from 'react-router-dom'
import ThemeLanguageToggle from '@/components/ThemeLanguageToggle'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight, RefreshCw, Trash2 } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft } from 'lucide-react'
import { useLoading } from '@/contexts/useLoading'

interface DailyCode {
    id?: number
    code: string
    created_at?: string
    valid_until?: string
    table_id?: number | null
    table_name?: string
}

const LoyaltyManagement: React.FC = () => {
    const navigate = useNavigate()
    const { setLoading } = useLoading()
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState<string>('')
    const [generatedCodes, setGeneratedCodes] = useState<DailyCode[]>([])
    const [existingCode, setExistingCode] = useState<DailyCode | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    useEffect(() => {
        checkExistingCode()
    }, [])

    const checkExistingCode = async () => {
        try {
            setLoading(true)
            setMessage('جاري التحقق من وجود كود لليوم الحالي...')

            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data, error } = await supabase
                .from('daily_codes')
                .select('*')
                .gte('valid_until', today.toISOString())
                .order('created_at', { ascending: false })
                .limit(1)

            if (error) {
                throw new Error(`خطأ في جلب الكود الحالي: ${error.message}`)
            }

            if (data && data.length > 0) {
                setExistingCode(data[0])
                setGeneratedCodes([data[0]])
                setStatus('success')
                setMessage('تم العثور على كود لليوم الحالي')
            } else {
                setExistingCode(null)
                setStatus('idle')
                setMessage('')
            }
        } catch (error) {
            console.error('خطأ في التحقق من وجود كود:', error)
            setStatus('error')
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'حدث خطأ أثناء التحقق من وجود كود'
            )
        } finally {
            setLoading(false)
        }
    }

    const generateDailyCodes = async () => {
        try {
            if (existingCode) {
                setStatus('error')
                setMessage(
                    'يوجد بالفعل كود لليوم الحالي. يرجى حذف الكود الحالي أولاً قبل إنشاء كود جديد.'
                )
                return
            }

            setLoading(true)
            setMessage('جاري توليد الكود اليومي...')

            const today = new Date()
            const validUntil = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                23,
                59,
                59
            ).toISOString()

            const dailyCode = {
                code: generateRandomCode(),
                valid_until: validUntil,
            }

            const { data, error } = await supabase
                .from('daily_codes')
                .insert([dailyCode])
                .select()

            if (error) {
                throw new Error(`خطأ في حفظ الكود: ${error.message}`)
            }

            setStatus('success')
            setMessage('تم توليد الكود اليومي بنجاح!')
            setGeneratedCodes(data || [dailyCode])
            setExistingCode(data ? data[0] : dailyCode)
        } catch (error) {
            console.error('خطأ في توليد الكود اليومي:', error)
            setStatus('error')
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'حدث خطأ أثناء توليد الكود اليومي'
            )
        } finally {
            setLoading(false)
        }
    }

    const deleteExistingCode = async () => {
        try {
            if (!existingCode || !existingCode.id) {
                setStatus('error')
                setMessage('لا يوجد كود لحذفه')
                return
            }

            setIsDeleting(true)
            setLoading(true)

            const { error } = await supabase
                .from('daily_codes')
                .delete()
                .eq('id', existingCode.id)

            if (error) {
                throw new Error(`خطأ في حذف الكود: ${error.message}`)
            }

            setStatus('success')
            setMessage('تم حذف الكود بنجاح')
            setExistingCode(null)
            setGeneratedCodes([])
        } catch (error) {
            console.error('خطأ في حذف الكود:', error)
            setStatus('error')
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'حدث خطأ أثناء حذف الكود'
            )
        } finally {
            setIsDeleting(false)
            setIsDeleteDialogOpen(false)
            setLoading(false)
        }
    }

    const generateRandomCode = () => {
        return Math.floor(1000 + Math.random() * 9000).toString()
    }

    const getAlertVariant = () => {
        switch (status) {
            case 'success':
                return 'default'
            case 'error':
                return 'destructive'
            default:
                return 'default'
        }
    }

    return (
        <PageTransition>
            <div className='container p-6'>
                <div className='mb-6'>
                    <ThemeLanguageToggle />
                </div>

                <Button
                    variant='ghost'
                    className='mb-6 bg-yellow-400 dark:bg-white'
                    onClick={() => navigate('/staff-dashboard')}
                >
                    <ArrowRight className=' h-4 w-4' />
                    رجوع الي لوحة التحكم
                </Button>

                <h1 className='mb-6'>إدارة الولاء</h1>

                <Card className='mb-6'>
                    <CardHeader>
                        <CardTitle>توليد الكود اليومي</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <h1>
                            اضغط على الزر أدناه لتوليد كود يومي جديد (4 أرقام)
                            لجميع الطاولات. سيتم تخزين هذا الكود في قاعدة
                            البيانات وسيكون صالحًا لليوم الحالي فقط.
                        </h1>

                        <div className='flex gap-4'>
                            <Button
                                variant='default'
                                className='mt-4'
                                disabled={existingCode !== null}
                                onClick={generateDailyCodes}
                            >
                                <>
                                    <RefreshCw className='mr-2 h-4 w-4' />
                                    توليد الكود اليومي
                                </>
                            </Button>

                            {existingCode && (
                                <AlertDialog
                                    open={isDeleteDialogOpen}
                                    onOpenChange={setIsDeleteDialogOpen}
                                >
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant='destructive'
                                            className='mt-4'
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className='mr-2 h-4 w-4' />
                                            حذف الكود الحالي
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                هل أنت متأكد من حذف الكود
                                                الحالي؟
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                <p className='text-red-500 font-bold mb-2'>
                                                    تحذير هام!
                                                </p>
                                                <p>
                                                    حذف الكود الحالي سيؤدي إلى:
                                                </p>
                                                <ul className='list-disc list-inside my-2'>
                                                    <li>
                                                        عدم قدرة الزبائن على
                                                        استخدام الكود الحالي
                                                    </li>
                                                    <li>
                                                        حدوث مشاكل مع الزبائن
                                                        الذين يحاولون استخدام
                                                        الكود القديم
                                                    </li>
                                                    <li>
                                                        الحاجة إلى إبلاغ جميع
                                                        الزبائن بالكود الجديد
                                                        بعد إنشائه
                                                    </li>
                                                </ul>
                                                <p className='mt-2'>
                                                    يرجى التأكد من إبلاغ جميع
                                                    الموظفين والزبائن بهذا
                                                    التغيير.
                                                </p>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                إلغاء
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={deleteExistingCode}
                                                disabled={isDeleting}
                                                className='bg-red-500 hover:bg-red-600'
                                            >
                                                {isDeleting
                                                    ? 'جاري الحذف...'
                                                    : 'نعم، أريد الحذف'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>

                        {status !== 'idle' && (
                            <Alert variant={getAlertVariant()} className='mt-4'>
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {existingCode && (
                    <Card>
                        <CardHeader>
                            <CardTitle>الكود المولد</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='p-6 flex flex-col items-center justify-center border rounded-md'>
                                <h2 className='text-xl mb-2'>الكود اليومي</h2>
                                <div className='text-3xl font-bold bg-yellow-100 dark:bg-yellow-900 px-6 py-3 rounded-lg'>
                                    {existingCode.code}
                                </div>
                                <p className='mt-4 text-sm text-gray-500'>
                                    هذا الكود صالح حتى نهاية اليوم الحالي
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageTransition>
    )
}

export default LoyaltyManagement
