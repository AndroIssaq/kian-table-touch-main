import { Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface WifiSectionProps {
    language: string
}

const WifiSection = ({ language }: WifiSectionProps) => {
    const { toast } = useToast()

    const handleCopyPassword = () => {
        navigator.clipboard.writeText('CafeWifi2025')
        toast({
            title: language === 'ar' ? 'تم نسخ كلمة السر!' : 'Password copied!',
            description:
                language === 'ar'
                    ? 'تم نسخ كلمة سر الواي فاي بنجاح.'
                    : 'Wi-Fi password copied successfully.',
            variant: 'default',
        })
    }

    return (
        <Card className='w-full flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl shadow-lg bg-gradient-to-r from-[#e0f7fa] to-[#fffde4] dark:from-[#23243a] dark:to-[#181a20] border-2 border-gold/10'>
            <Wifi className='w-10 h-10 text-gold mb-2' />
            <div className='font-bold text-base sm:text-lg mb-1 text-center'>
                {language === 'ar'
                    ? 'احصل على واي فاي مجاني'
                    : 'Get Free Wi-Fi'}
            </div>
            <Button
                variant='outline'
                className='rounded-full px-6 py-2 flex items-center gap-2 text-gold border-gold hover:bg-gold/10 w-full sm:w-auto justify-center'
                onClick={handleCopyPassword}
            >
                <Wifi className='w-5 h-5' />
                {language === 'ar' ? 'نسخ كلمة السر' : 'Copy Password'}
            </Button>
        </Card>
    )
}

export default WifiSection
