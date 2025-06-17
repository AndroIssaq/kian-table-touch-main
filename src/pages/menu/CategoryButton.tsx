import { Coffee } from 'lucide-react'
import { categoryStyles } from '@/lib/constants'

interface Category {
    id: number
    name_ar: string
    name_en: string
}

interface CategoryButtonProps {
    category: Category
    index: number
    language: string
    tableNumber: number | null
    onClick: (path: string) => void
}

const CategoryButton = ({
    category,
    index,
    language,
    tableNumber,
    onClick,
}: CategoryButtonProps) => {
    const style = categoryStyles[category.id] || {
        color: 'bg-orange-400',
        icon: Coffee,
    }
    const Icon = style.icon

    return (
        <button
            key={category.id}
            style={{
                animation: `fadeInUp 0.5s ${0.1 * index}s both`,
            }}
            className={`rounded-2xl shadow-lg p-6 flex flex-col items-start justify-between min-h-[110px] transition-all duration-200 cursor-pointer hover:scale-105 active:scale-100 ${style.color}`}
            onClick={() =>
                onClick(`/menu/category/${category.id}?table=${tableNumber}`)
            }
        >
            <span className='flex items-center gap-2 mb-2'>
                <Icon className='w-6 h-6 text-white/90 drop-shadow' />
                <span className='text-lg font-bold'>
                    {language === 'ar' ? category.name_ar : category.name_en}
                </span>
            </span>
        </button>
    )
}

export default CategoryButton
