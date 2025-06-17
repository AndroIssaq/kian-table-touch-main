import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { useLanguage } from '@/contexts/useLanguage'
import { UserNavbar } from '@/components/UserNavbar'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import DrinkRecomaindationSystem from './DrinkRecomaindationSystem'
import { useAuth } from '@/contexts/useAuth'
import {
    WelcomeAnimation,
    InvoiceDialog,
    InvoiceFloatingButton,
    MusicPlayer,
    OffersCarousel,
    Suggestions,
    WifiSection,
    RecentOrders,
    ActionButtons,
} from '.'

const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.13,
            duration: 0.5,
            type: 'spring',
            stiffness: 60,
        },
    }),
}

const slides = [
    {
        emoji: '🥤',
        title: { ar: 'خصم 10% على كل المشروبات', en: '10% off all drinks' },
        desc: { ar: 'ساري اليوم فقط', en: 'Valid today only' },
    },
    {
        emoji: '🎁',
        title: {
            ar: 'مشروب مجاني عند كل 5 طلبات',
            en: 'Free drink with every 5 orders',
        },
        desc: { ar: 'اسأل عن نقاط الولاء', en: 'Ask about loyalty points' },
    },
    {
        emoji: '☕',
        title: {
            ar: 'عرض خاص على القهوة التركي',
            en: 'Special offer on Turkish coffee',
        },
        desc: {
            ar: 'جربها اليوم بسعر مميز',
            en: 'Try it today at a special price',
        },
    },
    {
        emoji: '🍪',
        title: {
            ar: 'كوكيز مجاني مع كل مشروب ساخن',
            en: 'Free cookie with every hot drink',
        },
        desc: { ar: 'لفترة محدودة', en: 'For a limited time' },
    },
]

const suggestions = [
    {
        emoji: '🍰',
        title: {
            ar: 'جرب التشيز كيك مع القهوة',
            en: 'Try cheesecake with coffee',
        },
        desc: { ar: 'طبق اليوم المميز', en: "Today's special dish" },
    },
    {
        emoji: '🧋',
        title: { ar: 'جرب مشروب البوبا الجديد', en: 'Try the new Boba drink' },
        desc: { ar: 'نكهات متعددة', en: 'Multiple flavors' },
    },
    {
        emoji: '🥗',
        title: {
            ar: 'سلطة فريش مع كل وجبة',
            en: 'Fresh salad with every meal',
        },
        desc: { ar: 'صحية وخفيفة', en: 'Healthy and light' },
    },
]

const songs = [
    {
        src: '/audio/Beethoven - Für Elise.mp3',
        name: 'Beethoven - Für Elise',
    },
    {
        src: '/audio/Beethoven - Moonlight Sonata (1st Movement).mp3',
        name: 'Beethoven - Moonlight Sonata',
    },
    {
        src: '/audio/Beethoven - Symphony No. 5 in C Minor (1).mp3',
        name: 'Beethoven - Symphony No. 5',
    },
    {
        src: '/audio/Chopin - Nocturne op.9 No.2.mp3',
        name: 'Chopin - Nocturne op.9 No.2',
    },
    {
        src: '/audio/HAUSER - Air on the G String (J. S. Bach).mp3',
        name: 'HAUSER - Air on the G String',
    },
    {
        src: '/audio/Ludovico Einaudi - Nuvole Bianche.mp3',
        name: 'Ludovico Einaudi - Nuvole Bianche',
    },
    {
        src: '/audio/Mozart - Piano Sonata No. 16 in C Major, K.545 (1st Mvt).mp3',
        name: 'Mozart - Piano Sonata No. 16',
    },
    {
        src: '/audio/Yiruma - River Flows in You.mp3',
        name: 'Yiruma - River Flows in You',
    },
]

const UserHome = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const {
        session: { user },
    } = useAuth()
    const { language } = useLanguage()
    const { toast } = useToast()
    const [recentOrders, setRecentOrders] = useState<any[]>([])
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
    const [table, setTable] = useState<string | null>(() => {
        return localStorage.getItem('selectedTable')
    })
    const [showWelcome, setShowWelcome] = useState(() => {
        return !localStorage.getItem('welcomeShown')
    })
    const [invoice, setInvoice] = useState<any[]>(() => {
        const stored = localStorage.getItem('invoice')
        return stored ? JSON.parse(stored) : []
    })
    const [currentSong, setCurrentSong] = useState(songs[0])
    const [isPlaying, setIsPlaying] = useState(false)

    // Enforce table number in localStorage
    useEffect(() => {
        const storedTable = localStorage.getItem('selectedTable')
        if (!storedTable) {
            navigate('/choose-table')
            return
        }
        setTable(storedTable)
    }, [navigate])

    useEffect(() => {
        const fetchRecentOrders = async () => {
            if (!user?.id) return
            //@ts-ignore
            const { data, error } = await supabase
                .from('waiter_requests')
                .select('id, created_at, request')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            if (!error && data) {
                const filtered = data
                    .filter((order: any) => {
                        const req = order.request?.trim()
                        return (
                            req &&
                            !req.includes('لا توجد طلبات سابقة') &&
                            !req.includes('لا يوجد طلب محدد')
                        )
                    })
                    .slice(0, 3)
                setRecentOrders(filtered)
            }
        }
        fetchRecentOrders()
    }, [user?.id])

    useEffect(() => {
        if (showWelcome) {
            const timer = setTimeout(() => {
                setShowWelcome(false)
                localStorage.setItem('welcomeShown', 'true')
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [showWelcome])

    useEffect(() => {
        localStorage.setItem('invoice', JSON.stringify(invoice))
    }, [invoice])

    useEffect(() => {
        if (invoiceDialogOpen) {
            const stored = localStorage.getItem('invoice')
            setInvoice(stored ? JSON.parse(stored) : [])
        }
    }, [invoiceDialogOpen])

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'invoice') {
                const stored = localStorage.getItem('invoice')
                setInvoice(stored ? JSON.parse(stored) : [])
            }
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    const handleClearInvoice = () => {
        setInvoice([])
        localStorage.setItem('invoice', JSON.stringify([]))
        setInvoiceDialogOpen(false)
    }

    const playRandomSong = () => {
        let nextSong = currentSong
        while (songs.length > 1 && nextSong.src === currentSong.src) {
            nextSong = songs[Math.floor(Math.random() * songs.length)]
        }
        setCurrentSong(nextSong)
        setTimeout(() => {
            const audio = document.getElementById(
                'cafe-music'
            ) as HTMLAudioElement
            if (audio) {
                audio.currentTime = 0
                audio.play()
            }
        }, 100)
    }

    const toggleMusic = () => {
        const audio = document.getElementById('cafe-music') as HTMLAudioElement
        if (!audio) return
        if (isPlaying) {
            audio.pause()
            setIsPlaying(false)
        } else {
            audio.currentTime = 0
            audio.play()
            setIsPlaying(true)
        }
    }

    useEffect(() => {
        const audio = document.getElementById('cafe-music') as HTMLAudioElement
        if (audio && isPlaying) {
            audio.currentTime = 0
            audio.play()
        }
    }, [currentSong])

    useEffect(() => {
        const audio = document.getElementById('cafe-music') as HTMLAudioElement
        if (!audio) return
        const handleEnded = () => setIsPlaying(false)
        audio.addEventListener('ended', handleEnded)
        return () => audio.removeEventListener('ended', handleEnded)
    }, [currentSong])

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }, [location.pathname])

    const userName = user?.email.split('@')[0] || 'ضيف'

    return (
        <div
            className='min-h-screen  bg-gradient-to-br from-[#fff8f0] via-[#f9f6ff] to-[#e8eaf6] dark:from-[#23243a] dark:via-[#181a20] dark:to-[#23243a] relative pb-32'
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            onClick={() => invoiceDialogOpen && setInvoiceDialogOpen(false)}
            style={{ cursor: invoiceDialogOpen ? 'pointer' : undefined }}
        >
            <WelcomeAnimation
                show={showWelcome}
                userName={userName}
                language={language}
            />

            <UserNavbar cartCount={0} />

            <div className='max-w-lg w-full  mx-auto px-2 sm:px-4 pt-4 sm:pt-6 space-y-5 sm:space-y-6'>
                {/* Section 1: Start Order */}
                <motion.div
                    className='w-full'
                    variants={sectionVariants}
                    initial='hidden'
                    animate='visible'
                    custom={0}
                >
                    <Card
                        className='w-full mt-[80px] flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl shadow-xl bg-gradient-to-r from-gold/90 to-yellow-200 cursor-pointer hover:scale-[1.03] transition-transform'
                        onClick={() => navigate(`/Menu?table=${table}`)}
                    >
                        <span className='text-2xl sm:text-3xl'>🍽️</span>
                        <div className='flex-1 min-w-0'>
                            <div className='text-lg sm:text-xl font-extrabold text-kian-burgundy truncate'>
                                {language === 'ar'
                                    ? 'ابدأ تصفح المنيو'
                                    : 'Start Browsing the Menu'}
                            </div>
                            <div className='text-xs sm:text-sm text-gray-500 truncate'>
                                {language === 'ar'
                                    ? 'اطلب أكلك أو مشروبك المفضل بسهولة'
                                    : 'Order your favorite food or drink easily'}
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Section 2: Previous Orders */}
                {user && (
                    <motion.div
                        variants={sectionVariants}
                        initial='hidden'
                        animate='visible'
                        custom={1}
                    >
                        <RecentOrders
                            orders={recentOrders}
                            language={language}
                        />
                    </motion.div>
                )}

                {/* Section: Drink Recommendation System */}
                <motion.div
                    variants={sectionVariants}
                    initial='hidden'
                    animate='visible'
                    custom={6}
                >
                    <DrinkRecomaindationSystem />
                </motion.div>

                {/* Section 3: Music Offer */}
                <motion.div
                    variants={sectionVariants}
                    initial='hidden'
                    animate='visible'
                    custom={2}
                >
                    <MusicPlayer
                        currentSong={currentSong}
                        isPlaying={isPlaying}
                        language={language}
                        onTogglePlay={toggleMusic}
                        onPlayRandom={() => {
                            playRandomSong()
                            setIsPlaying(true)
                        }}
                    />
                </motion.div>

                {/* Section 4: Today's Offers Carousel */}
                <motion.div
                    variants={sectionVariants}
                    initial='hidden'
                    animate='visible'
                    custom={3}
                >
                    <OffersCarousel offers={slides} language={language} />
                </motion.div>

                {/* Section 5: Get Wi-Fi */}
                <motion.div
                    variants={sectionVariants}
                    initial='hidden'
                    animate='visible'
                    custom={4}
                >
                    <WifiSection language={language} />
                </motion.div>

                {/* Section 6: Suggestions */}
                <motion.div
                    variants={sectionVariants}
                    initial='hidden'
                    animate='visible'
                    custom={5}
                >
                    <Suggestions
                        suggestions={suggestions}
                        language={language}
                    />
                </motion.div>
            </div>

            <ActionButtons
                language={language}
                table={table}
                onNavigate={navigate}
            />

            <InvoiceFloatingButton
                onClick={() => setInvoiceDialogOpen(true)}
                language={language}
            />

            <InvoiceDialog
                open={invoiceDialogOpen}
                onClose={() => setInvoiceDialogOpen(false)}
                invoice={invoice}
                onClear={handleClearInvoice}
                language={language}
            />
        </div>
    )
}

export default UserHome
