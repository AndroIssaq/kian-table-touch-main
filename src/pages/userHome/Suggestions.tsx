import { Card } from '@/components/ui/card'

interface Suggestion {
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

interface SuggestionsProps {
    suggestions: Suggestion[]
    language: string
}

const Suggestions = ({ suggestions, language }: SuggestionsProps) => {
    return (
        <>
            <div className='mb-2 font-bold text-base sm:text-lg flex items-center gap-2'>
                <span className='text-xl'>💡</span>
                {language === 'ar' ? 'مقترحات لك' : 'Suggestions for you'}
            </div>
            <div className='flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gold/30 scrollbar-track-transparent'>
                {suggestions.map((s, idx) => (
                    <Card
                        key={idx}
                        className='min-w-[140px] max-w-[180px] flex flex-col items-center p-3 rounded-xl shadow-md bg-white/80 dark:bg-kian-charcoal/80'
                    >
                        <span className='text-2xl mb-1'>{s.emoji}</span>
                        <div className='font-bold text-kian-burgundy dark:text-gold text-center mb-1'>
                            {s.title[language]}
                        </div>
                        <div className='text-xs text-gray-500 text-center'>
                            {s.desc[language]}
                        </div>
                    </Card>
                ))}
            </div>
        </>
    )
}

export default Suggestions
