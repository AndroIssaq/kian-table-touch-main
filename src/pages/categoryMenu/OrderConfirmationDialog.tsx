import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
const OrderConfirmationDialog = ({
    open,
    onOpenChange,
    selectedItem,
    onConfirm,
    language,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedItem: Item | null
    onConfirm: () => Promise<void>
    language: string
}) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-sm w-full rounded-2xl shadow-2xl'>
            <DialogHeader>
                <DialogTitle className='text-xl font-bold text-yellow-700 dark:text-yellow-300'>
                    {language === 'ar' ? 'تأكيد إرسال الطلب' : 'Confirm Order'}
                </DialogTitle>
            </DialogHeader>
            <div className='text-center text-base mb-4'>
                {selectedItem && (
                    <>
                        {language === 'ar'
                            ? `هل أنت متأكد من طلبك لشراء "${selectedItem.name_ar}"؟ سيتم إرسال الطلب للنادل.`
                            : `Are you sure you want to order "${selectedItem.name_en}"? The order will be sent to the waiter.`}
                    </>
                )}
            </div>
            <DialogFooter className='flex gap-2 justify-center'>
                <Button variant='secondary' onClick={() => onOpenChange(false)}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                    className='bg-yellow-500 hover:bg-yellow-600 text-white font-bold'
                    onClick={onConfirm}
                >
                    {language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
)

export default OrderConfirmationDialog
