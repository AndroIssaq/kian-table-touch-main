import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ReceiptText } from 'lucide-react'
import PageTransition from '@/components/PageTransition'
import ThemeLanguageToggle from '@/components/ThemeLanguageToggle'
import { useLanguage } from '@/contexts/useLanguage'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import UserNavbar from '@/components/UserNavbar'
import { useCart } from '@/contexts/useCart'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/useAuth'
import { categoryNames } from '@/lib/constants'
import {
    LoyaltyPurchaseDialog,
    OrderConfirmationDialog,
    InvoiceFloatingButton,
    InvoiceDialog,
    MenuItem,
} from '.'

export default function CategoryMenu() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const table = Number(new URLSearchParams(location.search).get('table'))
    const { t, language } = useLanguage()
    const {
        session: { user },
        loyaltyPoints,
        refreshLoyaltyPoints,
        updateLoyaltyPoints,
    } = useAuth()
    const numericId = Number(id)
    const catName = categoryNames[numericId]?.[language] || ''
    const [items, setItems] = useState<Item[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const { cart } = useCart()
    const [confirmLoyaltyDialogOpen, setConfirmLoyaltyDialogOpen] =
        useState<boolean>(false)
    const [selectedLoyaltyItem, setSelectedLoyaltyItem] = useState<Item | null>(
        null
    )
    const [invoice, setInvoice] = useState<InvoiceItem[]>(() => {
        const stored = localStorage.getItem('invoice')
        return stored ? JSON.parse(stored) : []
    })
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState<boolean>(false)
    const [confirmOrderDialogOpen, setConfirmOrderDialogOpen] =
        useState<boolean>(false)
    const [selectedOrderItem, setSelectedOrderItem] = useState<Item | null>(
        null
    )

    // Effects
    useEffect(() => {
        localStorage.setItem('invoice', JSON.stringify(invoice))
    }, [invoice])

    useEffect(() => {
        if (!table) {
            navigate('/choose-table')
            return
        }
        const fetchItems = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('category_id', numericId)
                .order('id', { ascending: true })
            if (error) {
                toast({
                    title: language === 'ar' ? 'خطأ' : 'Error',
                    description:
                        language === 'ar'
                            ? 'حدث خطأ أثناء تحميل العناصر'
                            : 'Failed to load items',
                    variant: 'destructive',
                })
                setItems([])
            } else {
                setItems(
                    (data || []).map((item) => ({
                        ...item,
                        id: Number(item.id),
                    }))
                )
            }
            setLoading(false)
        }
        if (numericId) fetchItems()
    }, [numericId, language, table, navigate])

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const table = params.get('table') || params.get('tableNumber')
        if (!table) navigate('/choose-table')
    }, [location.search, navigate])

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }, [location.pathname])

    // Handlers
    const handleOrder = (item: Item) => {
        setSelectedOrderItem(item)
        setConfirmOrderDialogOpen(true)
    }

    const handleConfirmOrderDialog = async () => {
        if (selectedOrderItem) {
            setInvoice((prev) => [
                ...prev,
                {
                    name: selectedOrderItem[`name_${language}`],
                    quantity: 1,
                    type: 'cash',
                    price: Number(selectedOrderItem.price),
                    points: null,
                },
            ])
            try {
                await supabase.from('waiter_requests').insert([
                    {
                        table_number: table,
                        request: `${selectedOrderItem[`name_${language}`]} x1`,
                        status: 'new',
                        created_at: new Date().toISOString(),
                        deleted: false,
                        user_id: user?.id,
                        user_name: user?.email.split('@')[0] || '',
                    },
                ])
                if (user?.id) {
                    await updateLoyaltyPoints(1)
                    const loyaltyMsg =
                        language === 'ar'
                            ? `لديك الآن ${loyaltyPoints} نقطة (لا نقاط إضافية اليوم).`
                            : `You now have ${loyaltyPoints} points (no extra points today).`
                    toast({
                        title:
                            language === 'ar' ? 'تم إرسال الطلب' : 'Order sent',
                        description: `${
                            language === 'ar'
                                ? 'تم إرسال طلبك بنجاح وسيظهر للنادل.'
                                : 'Your order has been sent and will appear to the staff.'
                        } ${loyaltyMsg}`,
                        duration: 3000,
                    })
                } else {
                    toast({
                        title:
                            language === 'ar' ? 'تم إرسال الطلب' : 'Order sent',
                        description:
                            language === 'ar'
                                ? 'تم إرسال طلبك بنجاح وسيظهر للنادل.'
                                : 'Your order has been sent and will appear to the staff.',
                        duration: 3000,
                    })
                }
            } catch (err) {
                toast({
                    title: language === 'ar' ? 'خطأ' : 'Error',
                    description:
                        language === 'ar'
                            ? 'حدث خطأ أثناء إرسال الطلب.'
                            : 'Failed to send order.',
                    variant: 'destructive',
                })
            }
        }
        setConfirmOrderDialogOpen(false)
        setSelectedOrderItem(null)
    }

    const handleBuyWithPoints = async (item: Item) => {
        if (!user || !item) return
        let userPoints = loyaltyPoints
        if (userPoints === null) {
            await refreshLoyaltyPoints()
            userPoints = loyaltyPoints
        }
        const { data: itemPointsData, error: itemError } = await supabase
            .from('items')
            .select('points')
            //@ts-ignore
            .eq('id', item.id)
            .single()
        if (itemError || !itemPointsData) {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description:
                    language === 'ar'
                        ? 'تعذر جلب نقاط المنتج.'
                        : 'Failed to fetch item points.',
                variant: 'destructive',
            })
            setConfirmLoyaltyDialogOpen(false)
            setSelectedLoyaltyItem(null)
            return
        }
        const itemPoints = itemPointsData.points || 0
        if (userPoints < itemPoints) {
            toast({
                title:
                    language === 'ar' ? 'نقاط غير كافية' : 'Not enough points',
                description:
                    language === 'ar'
                        ? 'نقاط الولاء لا تكفي لشراء هذا المنتج.'
                        : 'You do not have enough loyalty points to buy this item.',
                variant: 'destructive',
            })
            setConfirmLoyaltyDialogOpen(false)
            setSelectedLoyaltyItem(null)
            return
        }
        await updateLoyaltyPoints(-itemPoints)
        setInvoice((prev) => [
            ...prev,
            {
                name: item[`name_${language}`],
                quantity: 1,
                type: 'loyalty',
                price: 0,
                points: itemPoints,
            },
        ])
        await refreshLoyaltyPoints()
        const { error: insertError } = await supabase
            .from('waiter_requests')
            .insert([
                {
                    table_number: table,
                    request: `${item[`name_${language}`]} (شراء بنقاط الولاء)`,
                    status: 'new',
                    created_at: new Date().toISOString(),
                    deleted: false,
                    user_id: user.id,
                    user_name: user?.email.split('@')[0] || '',
                },
            ])
        if (insertError) {
            toast({
                title: language === 'ar' ? 'خطأ' : 'Error',
                description:
                    language === 'ar'
                        ? 'تم خصم النقاط لكن حدث خطأ في تسجيل الطلب.'
                        : 'Points deducted but failed to register order.',
                variant: 'destructive',
            })
            setConfirmLoyaltyDialogOpen(false)
            setSelectedLoyaltyItem(null)
            return
        }
        toast({
            title:
                language === 'ar' ? 'تم الشراء بنجاح' : 'Purchase successful',
            description:
                language === 'ar'
                    ? `تم خصم ${itemPoints} نقطة من رصيدك.`
                    : `${itemPoints} points have been deducted from your balance.`,
            duration: 3000,
        })
        setConfirmLoyaltyDialogOpen(false)
        setSelectedLoyaltyItem(null)
    }

    const handleClearInvoice = () => {
        setInvoice([])
        localStorage.removeItem('invoice')
        setInvoiceDialogOpen(false)
    }

    return (
        <PageTransition>
            <UserNavbar cartCount={cart.length} />

            <LoyaltyPurchaseDialog
                open={confirmLoyaltyDialogOpen}
                onOpenChange={setConfirmLoyaltyDialogOpen}
                selectedItem={selectedLoyaltyItem}
                onConfirm={handleBuyWithPoints}
                language={language}
            />

            <OrderConfirmationDialog
                open={confirmOrderDialogOpen}
                onOpenChange={setConfirmOrderDialogOpen}
                selectedItem={selectedOrderItem}
                onConfirm={handleConfirmOrderDialog}
                language={language}
            />

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
                className='fixed top-6 left-6 z-[100] w-10 h-10 flex items-center justify-center rounded-full shadow bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all duration-150 hidden sm:flex'
                style={{ boxShadow: '0 4px 16px 0 rgba(120,120,120,0.10)' }}
                aria-label={language === 'ar' ? 'الرجوع' : 'Back'}
            >
                <ArrowLeft className='w-5 h-5 text-kian-burgundy' />
            </button>

            <div className='cafe-container'>
                <div className='mb-6 flex justify-between items-center'>
                    <ThemeLanguageToggle />
                </div>
                <h1 className='text-3xl md:text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-kian-burgundy via-gold to-[#494848] bg-clip-text text-transparent drop-shadow-lg'>
                    {catName}
                </h1>
                <p className='text-center text-kian-charcoal/80 dark:text-kian-sand/80 mb-8'>
                    {t('table')} {table}
                </p>
                <div className='flex justify-end items-center gap-2 mb-2'>
                    <span className='font-bold text-yellow-700 dark:text-yellow-300'>
                        {language === 'ar' ? 'نقاطك:' : 'Your Points:'}{' '}
                        {loyaltyPoints ?? '--'}
                    </span>
                </div>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-6'>
                    {loading ? (
                        <div className='col-span-full text-center text-lg text-kian-charcoal/60 dark:text-kian-sand/60 py-12'>
                            {language === 'ar'
                                ? 'جاري التحميل...'
                                : 'Loading...'}
                        </div>
                    ) : items.length === 0 ? (
                        <div className='col-span-full text-center text-lg text-kian-charcoal/60 dark:text-kian-sand/60 py-12'>
                            {language === 'ar'
                                ? 'لا توجد عناصر في هذا القسم حالياً'
                                : 'No items in this category yet.'}
                        </div>
                    ) : (
                        items.map((item) => (
                            <MenuItem
                                key={item.id}
                                item={item}
                                onOrder={handleOrder}
                                onLoyaltyPurchase={(item) => {
                                    setSelectedLoyaltyItem(item)
                                    setConfirmLoyaltyDialogOpen(true)
                                }}
                                language={language}
                            />
                        ))
                    )}
                </div>
            </div>
        </PageTransition>
    )
}
