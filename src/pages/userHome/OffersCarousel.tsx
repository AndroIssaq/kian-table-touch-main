import { Gift } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

interface Offer {
    emoji: string
    title: {
        ar: string
        en: string
    }
    desc: {
        ar: string
        en: string
    }
}

interface OffersCarouselProps {
    offers: Offer[]
    language: string
}

const OffersCarousel = ({ offers, language }: OffersCarouselProps) => {
    return (
        <>
            <div className='mb-2 font-bold text-base sm:text-lg flex items-center gap-2'>
                <Gift className='w-5 h-5 text-gold' />
                {language === 'ar' ? 'عروض النهاردة' : "Today's Offers"}
            </div>
            <Swiper
                key={language}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                modules={[Autoplay, Pagination]}
                spaceBetween={16}
                slidesPerView={2}
                loop={true}
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                className='w-full py-2'
            >
                {offers.map((offer, idx) => (
                    <SwiperSlide key={idx}>
                        <Card className='flex flex-col items-center p-6 rounded-2xl shadow-xl bg-gradient-to-br from-yellow-50 to-gold/20 border-2 border-gold/10 mx-1'>
                            <span className='text-4xl mb-3 animate-bounce'>
                                {offer.emoji}
                            </span>
                            <div className='font-bold text-lg sm:text-xl text-kian-burgundy dark:text-gold text-center mb-2'>
                                {offer.title[language]}
                            </div>
                            <div className='text-xs sm:text-sm text-gray-500 text-center'>
                                {offer.desc[language]}
                            </div>
                        </Card>
                    </SwiperSlide>
                ))}
            </Swiper>
        </>
    )
}

export default OffersCarousel
