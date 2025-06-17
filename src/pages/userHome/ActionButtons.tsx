import { Bell, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActionButtonsProps {
    language: string
    table: string | null
    onNavigate: (path: string) => void
}

const ActionButtons = ({ language, table, onNavigate }: ActionButtonsProps) => {
    return (
        <div className='fixed bottom-0 left-0 w-full z-20 flex flex-col items-center pb-3 sm:pb-4 pointer-events-none'>
            <div className='flex items-center justify-center gap-2 sm:gap-3 w-full max-w-lg px-2 sm:px-4 pointer-events-auto'>
                <Button
                    className='w-[45%] h-14 sm:h-14 rounded-2xl bg-gold text-kian-charcoal font-bold text-base sm:text-lg shadow-lg hover:bg-[#dfa804]'
                    onClick={() => onNavigate(`/call-waiter?table=${table}`)}
                >
                    <Bell className='w-5 h-5 mr-1 sm:mr-2' />
                    {language === 'ar'
                        ? 'نداء سريع للنادل'
                        : 'Quick Call Waiter'}
                </Button>
                <Button
                    className='w-[45%] h-14 text-wrap sm:h-14 rounded-2xl bg-white/90 dark:bg-kian-charcoal/90 text-kian-burgundy dark:text-gold font-bold text-base sm:text-lg shadow-lg border border-gold hover:bg-gold/10'
                    onClick={() => onNavigate(`/Menu?table=${table}`)}
                >
                    <Receipt className='w-5 h-5 mr-1 sm:mr-2' />
                    {language === 'ar' ? 'طلب من المنيو' : 'Request from Menu'}
                </Button>
            </div>
        </div>
    )
}

export default ActionButtons
