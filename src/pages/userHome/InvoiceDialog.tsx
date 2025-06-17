import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface InvoiceItem {
    name: string
    quantity: number
    type: 'cash' | 'loyalty'
    price: number
    points: number | null
}

interface InvoiceDialogProps {
    open: boolean
    onClose: () => void
    invoice: InvoiceItem[]
    onClear: () => void
    language: string
}

const InvoiceDialog = ({
    open,
    onClose,
    invoice,
    onClear,
    language,
}: InvoiceDialogProps) => {
    if (!open) return null

    return (
        <motion.div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/70'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <Card
                className='w-full max-w-md p-6 rounded-2xl shadow-xl bg-white dark:bg-kian-charcoal'
                onClick={(e) => e.stopPropagation()}
            >
                <div className='flex justify-between items-center mb-4'>
                    <div className='text-lg font-bold text-kian-burgundy'>
                        {language === 'ar'
                            ? 'فاتورة المشتريات'
                            : 'Purchase Invoice'}
                    </div>
                    <Button
                        variant='ghost'
                        className='h-10 w-10 p-0 rounded-full'
                        onClick={onClose}
                    >
                        <span className='text-2xl'>×</span>
                    </Button>
                </div>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm text-center'>
                        <thead>
                            <tr className='bg-gold/20'>
                                <th>{language === 'ar' ? 'المنتج' : 'Item'}</th>
                                <th>{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                                <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
                                <th>{language === 'ar' ? 'السعر' : 'Price'}</th>
                                <th>
                                    {language === 'ar' ? 'النقاط' : 'Points'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className='py-6 text-gray-400'
                                    >
                                        {language === 'ar'
                                            ? 'لا توجد مشتريات بعد'
                                            : 'No purchases yet'}
                                    </td>
                                </tr>
                            ) : (
                                invoice.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{row.name}</td>
                                        <td>{row.quantity}</td>
                                        <td>
                                            {row.type === 'loyalty'
                                                ? language === 'ar'
                                                    ? 'نقاط'
                                                    : 'Loyalty'
                                                : language === 'ar'
                                                ? 'نقدي'
                                                : 'Cash'}
                                        </td>
                                        <td>
                                            {row.type === 'cash'
                                                ? `${row.price} EGP`
                                                : '-'}
                                        </td>
                                        <td>
                                            {row.type === 'loyalty'
                                                ? row.points
                                                : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className='mt-4 text-lg font-bold text-right'>
                    {language === 'ar'
                        ? 'الإجمالي المطلوب دفعه:'
                        : 'Total to Pay:'}{' '}
                    {invoice
                        .filter((i) => i.type === 'cash')
                        .reduce((sum, i) => sum + i.price * i.quantity, 0)}{' '}
                    EGP
                </div>
                <div className='flex justify-center mt-6'>
                    <Button
                        className='bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-2 rounded-full'
                        onClick={onClear}
                    >
                        {language === 'ar' ? 'تم الدفع' : 'Paid'}
                    </Button>
                </div>
            </Card>
        </motion.div>
    )
}

export default InvoiceDialog
