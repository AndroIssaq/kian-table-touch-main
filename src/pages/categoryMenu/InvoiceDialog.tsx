import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

const InvoiceDialog = ({
    open,
    onOpenChange,
    invoice,
    onClear,
    language,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    invoice: InvoiceItem[]
    onClear: () => void
    language: string
}) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-lg w-full rounded-2xl shadow-2xl'>
            <DialogHeader>
                <DialogTitle className='text-2xl font-bold text-kian-burgundy dark:text-gold'>
                    {language === 'ar'
                        ? 'فاتورة المشتريات'
                        : 'Purchase Invoice'}
                </DialogTitle>
            </DialogHeader>
            <div className='overflow-x-auto'>
                <table className='w-full text-sm text-center'>
                    <thead>
                        <tr className='bg-gold/20'>
                            <th>{language === 'ar' ? 'المنتج' : 'Item'}</th>
                            <th>{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                            <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
                            <th>{language === 'ar' ? 'السعر' : 'Price'}</th>
                            <th>{language === 'ar' ? 'النقاط' : 'Points'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.length === 0 ? (
                            <tr>
                                <td colSpan={5} className='py-6 text-gray-400'>
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
                {language === 'ar' ? 'الإجمالي المطلوب دفعه:' : 'Total to Pay:'}{' '}
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
        </DialogContent>
    </Dialog>
)

export default InvoiceDialog
