import { Coffee } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Order {
    id: string
    created_at: string
    request: string
}

interface RecentOrdersProps {
    orders: Order[]
    language: string
}

const RecentOrders = ({ orders, language }: RecentOrdersProps) => {
    return (
        <>
            <div className='mb-2 font-bold text-base sm:text-lg flex items-center gap-2'>
                <Coffee className='w-5 h-5 text-gold' />
                {language === 'ar' ? 'الطلبات السابقة' : 'Previous Orders'}
            </div>
            <div className='flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gold/30 scrollbar-track-transparent'>
                {orders.length === 0 && (
                    <div className='text-gray-400 text-sm py-4 px-2'>
                        {language === 'ar'
                            ? 'لا يوجد طلبات سابقة'
                            : 'No previous orders'}
                    </div>
                )}
                {orders.map((order) => (
                    <Card
                        key={order.id}
                        className='min-w-[140px] max-w-[160px] flex flex-col items-center p-3 rounded-xl shadow-md bg-white/80 dark:bg-kian-charcoal/80'
                    >
                        <span className='text-2xl mb-1'>🧾</span>
                        <div className='font-bold text-kian-burgundy dark:text-gold text-center mb-1'>
                            {order.request}
                        </div>
                        <div className='text-xs text-gray-500 text-center'>
                            {order.created_at?.slice(0, 10)}
                        </div>
                    </Card>
                ))}
            </div>
        </>
    )
}

export default RecentOrders
