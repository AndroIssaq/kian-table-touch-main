import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageTransition from '@/components/PageTransition'
import { toast } from '@/components/ui/use-toast'
import { useLanguage } from '@/contexts/useLanguage'
import ThemeLanguageToggle from '@/components/ThemeLanguageToggle'
import UserNavbar from '@/components/UserNavbar'
import { supabase } from '@/lib/supabase/client'
import { InvoiceDialog, InvoiceFloatingButton, CategoryButton } from './index'

interface Category {
    id: number
    name_ar: string
    name_en: string
}

interface InvoiceItem {
    name: string
    quantity: number
    type: 'cash' | 'loyalty'
    price: number
    points: number | null
}

const Menu = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [tableNumber, setTableNumber] = useState<number | null>(null)
    const { t, language } = useLanguage()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
    const [invoice, setInvoice] = useState<InvoiceItem[]>(() => {
        const stored = localStorage.getItem('invoice')
        return stored ? JSON.parse(stored) : []
    })

    useEffect(() => {
        const storedTable = Number(localStorage.getItem('selectedTable'))
        if (!storedTable || isNaN(storedTable)) {
            toast({
                title: t('error'),
                description: t('noTable'),
                variant: 'destructive',
            })
            navigate('/choose-table')
            return
        }

        try {
            setTableNumber(storedTable)
        } catch (error) {
            toast({
                title: t('error'),
                description: t('noTable'),
                variant: 'destructive',
            })
            localStorage.removeItem('selectedTable')
            navigate('/choose-table')
        }
    }, [navigate, t])

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('id', { ascending: true })
            if (error) {
                toast({
                    title: language === 'ar' ? 'خطأ' : 'Error',
                    description:
                        language === 'ar'
                            ? 'حدث خطأ أثناء تحميل التصنيفات'
                            : 'Failed to load categories',
                    variant: 'destructive',
                })
                setCategories([])
            } else {
                setCategories(data || [])
            }
            setLoading(false)
        }
        fetchCategories()
    }, [language])

    useEffect(() => {
        localStorage.setItem('invoice', JSON.stringify(invoice))
    }, [invoice])

    const handleClearInvoice = () => {
        setInvoice([])
        localStorage.removeItem('invoice')
        setInvoiceDialogOpen(false)
    }

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }, [location.pathname])

    return (
        <PageTransition>
            <UserNavbar cartCount={invoice.length} />
            <div className='min-h-screen bg-gradient-to-br from-[#f6f7fb] via-[#f9f6ff] to-[#e8eaf6] dark:from-[#181a20] dark:via-[#23243a] dark:to-[#181a20] p-0'>
                <div className='cafe-container'>
                    <div className='mb-6 flex justify-between items-center'>
                        <ThemeLanguageToggle />
                    </div>
                    <h1 className='text-3xl md:text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-kian-burgundy via-gold to-[#494848] bg-clip-text text-transparent drop-shadow-lg'>
                        {t('restaurantMenu')}
                    </h1>
                    <p className='text-center text-kian-charcoal/80 dark:text-kian-sand/80 mb-8'>
                        {t('table')} {tableNumber}
                    </p>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-10'>
                        {loading ? (
                            <div className='col-span-4 text-center py-8 text-lg font-bold opacity-60'>
                                {language === 'ar'
                                    ? 'جاري التحميل...'
                                    : 'Loading...'}
                            </div>
                        ) : categories.length === 0 ? (
                            <div className='col-span-4 text-center py-8 text-lg font-bold opacity-60'>
                                {language === 'ar'
                                    ? 'لا توجد بيانات لعرضها'
                                    : 'No data to display'}
                            </div>
                        ) : (
                            categories.map((cat, idx) => (
                                <CategoryButton
                                    key={cat.id}
                                    category={cat}
                                    index={idx}
                                    language={language}
                                    tableNumber={tableNumber}
                                    onClick={navigate}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            <InvoiceFloatingButton
                onClick={() => setInvoiceDialogOpen(true)}
                language={language}
            />

            <InvoiceDialog
                open={invoiceDialogOpen}
                onOpenChange={setInvoiceDialogOpen}
                invoice={invoice}
                onClear={handleClearInvoice}
                language={language}
            />

            <button
                onClick={() => navigate(-1)}
                className='fixed top-6 left-6 z-[100] w-10 h-10 lg:flex items-center justify-center rounded-full shadow bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all duration-150 hidden sm:flex'
                style={{ boxShadow: '0 4px 16px 0 rgba(120,120,120,0.10)' }}
                aria-label={language === 'ar' ? 'الرجوع' : 'Back'}
            >
                <ArrowLeft className='w-5 h-5 text-kian-burgundy' />
            </button>
        </PageTransition>
    )
}

export default Menu

/* أضف كود CSS للأنيميشن في أعلى الملف أو في ملف CSS عام:
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
*/
