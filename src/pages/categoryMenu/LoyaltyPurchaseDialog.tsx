import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
const LoyaltyPurchaseDialog = ({
    open,
    onOpenChange,
    selectedItem,
    onConfirm,
    language,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedItem: Item | null
    onConfirm: (item: Item) => Promise<void>
    language: string
}) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-sm w-full rounded-2xl shadow-2xl'>
            <DialogHeader>
                <DialogTitle className='text-xl font-bold text-yellow-700 dark:text-yellow-300'>
                    {language === 'ar'
                        ? 'تأكيد الشراء بنقاط الولاء'
                        : 'Confirm Loyalty Points Purchase'}
                </DialogTitle>
            </DialogHeader>
            <div className='text-center text-base mb-4'>
                {selectedItem && (
                    <>
                        {language === 'ar'
                            ? `هل أنت متأكد أنك تريد شراء "${selectedItem.name_ar}" مقابل ${selectedItem.points} نقطة؟`
                            : `Are you sure you want to buy "${selectedItem.name_en}" for ${selectedItem.points} points?`}
                    </>
                )}
            </div>
            <DialogFooter className='flex gap-2 justify-center'>
                <Button variant='secondary' onClick={() => onOpenChange(false)}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                    className='bg-yellow-500 hover:bg-yellow-600 text-white font-bold'
                    onClick={() => selectedItem && onConfirm(selectedItem)}
                >
                    {language === 'ar' ? 'تأكيد الشراء' : 'Confirm Purchase'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
)

export default LoyaltyPurchaseDialog
