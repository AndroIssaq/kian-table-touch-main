import { ReceiptText } from 'lucide-react'

interface InvoiceFloatingButtonProps {
    onClick: () => void
    language: string
}

const InvoiceFloatingButton = ({
    onClick,
    language,
}: InvoiceFloatingButtonProps) => (
    <button
        onClick={onClick}
        className='fixed bottom-[70px] right-6 z-[100] flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-kian-burgundy font-extrabold text-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105'
        style={{ boxShadow: '0 8px 32px 0 rgba(255, 193, 7, 0.25)' }}
        aria-label='عرض الفاتورة'
    >
        <ReceiptText className='w-6 h-6 mr-1 text-kian-burgundy drop-shadow' />
        <span className='hidden sm:inline'>
            {language === 'ar' ? 'عرض الفاتورة' : 'View Invoice'}
        </span>
    </button>
)

export default InvoiceFloatingButton
