import { Button } from '@/components/ui/button'

const MenuItem = ({
    item,
    onOrder,
    onLoyaltyPurchase,
    language,
}: {
    item: Item
    onOrder: (item: Item) => void
    onLoyaltyPurchase: (item: Item) => void
    language: string
}) => (
    <div className='rounded-2xl shadow-lg bg-white/80 dark:bg-kian-charcoal/80 p-4 flex flex-col items-center transition-all duration-200 hover:scale-105'>
        {item.image_url && item.image_url.trim() !== '' && (
            <img
                src={
                    item.image_url.startsWith('http') ||
                    item.image_url.startsWith('/')
                        ? item.image_url
                        : `/images/${item.image_url}`
                }
                alt={item[`name_${language}`]}
                className='w-24 h-24 object-cover rounded-xl mb-3 border border-gold/30'
                onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display =
                        'none'
                }}
            />
        )}
        <div className='text-lg font-bold mb-1 text-center text-kian-burgundy dark:text-gold'>
            {item[`name_${language}`]}
        </div>
        <div className='text-base text-kian-charcoal/80 dark:text-kian-sand/80 mb-2'>
            {item.price} EGP
        </div>
        {item[`description_${language}`] && (
            <div className='text-xs text-gray-500 dark:text-gray-300 mb-2 text-center'>
                {item[`description_${language}`]}
            </div>
        )}
        <Button
            variant='outline'
            className='w-full mt-auto'
            onClick={() => onOrder(item)}
        >
            {language === 'ar' ? 'شراء' : 'Order Normally'}
        </Button>
        <Button
            variant='secondary'
            className='w-full mt-2 text-wrap text bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold text-xs border border-yellow-300 px-2 py-1 md:text-sm md:px-4 md:py-2 transition-all duration-200'
            disabled={!item.points || item.points <= 0}
            onClick={() => onLoyaltyPurchase(item)}
        >
            {language === 'ar'
                ? `اشتري بنقاط الولاء (${item.points ?? 0} نقطة)`
                : `Buy with Loyalty Points (${item.points ?? 0} pts)`}
        </Button>
    </div>
)

export default MenuItem
