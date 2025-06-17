import { Loader2 } from 'lucide-react'
import { useLoading } from '@/contexts/useLoading'

export default function CentralLoader() {
    const { loading } = useLoading()
    if (!loading) return null
    return (
        <div className='fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 animate-fade-in'>
            <Loader2 className='animate-spin w-20 h-20 text-gold mb-6' />
            <span className='text-xl font-bold text-kian-burgundy dark:text-gold mt-2'>
                جاري تحميل الصفحة...
            </span>
        </div>
    )
}
