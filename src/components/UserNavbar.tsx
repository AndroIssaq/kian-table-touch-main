import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import ThemeLanguageToggle from '@/components/ThemeLanguageToggle'
import { useLoyaltyPoints } from '@/contexts/useLoyaltyPoints'
import { useAuth } from '@/contexts/useAuth'
interface TubelightNavbarProps {
    logo?: React.ReactNode
    cartCount: number
    onCartClick?: () => void
}

export function UserNavbar({
    logo,
    cartCount,
    onCartClick,
}: {
    logo?: React.ReactNode
    cartCount: number
    onCartClick?: () => void
}) {
    const {
        session: { user },
        logout,
        loyaltyPoints,
        refreshLoyaltyPoints,
    } = useAuth()
    const [loading, setLoading] = useState(false)

    return (
        <nav
            className={cn(
                'fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-[85%] md:w-[50%] lg:w-[50%] bg-gradient-to-br from-white via-[#f9f6ff] to-[#e8eaf6] dark:from-[#23243a] dark:via-[#181a20] dark:to-[#23243a] shadow-2xl flex flex-row sm:flex-row items-center justify-between px-4 py-3 sm:px-10 sm:py-3 gap-2 sm:gap-0 backdrop-blur-xl rounded-[50px]'
            )}
        >
            {/* Logo */}
            <div className='flex items-center gap-3 flex-shrink-0'>
                {logo || (
                    <span className='text-xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-kian-burgundy via-gold to-kian-burgundy tracking-tight select-none drop-shadow-lg'>
                        Example Café
                    </span>
                )}
            </div>
            <div className='flex flex-1 flex-row items-center gap-4 w-full justify-between sm:justify-end'>
                {/* Cart Icon (modern) */}
                {onCartClick && (
                    <button
                        className='relative p-1 rounded-full bg-gradient-to-tr from-gold via-[#f9e7c2] to-gold shadow-xl hover:scale-110 transition-transform border-2 border-gold/70 focus:outline-none group'
                        onClick={onCartClick}
                        aria-label='سلة الطلبات'
                        style={{ minWidth: 52, minHeight: 52 }}
                    >
                        <span className='flex items-center justify-center w-12 h-12 bg-white/90 dark:bg-kian-charcoal/90 rounded-full shadow-inner group-hover:bg-gold/20 transition-colors'>
                            <ShoppingCart className='h-7 w-7 text-kian-burgundy dark:text-gold' />
                        </span>
                        {cartCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 20,
                                }}
                                className='absolute -top-1 -right-1 bg-kian-burgundy text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-md border-2 border-white dark:border-kian-charcoal animate-bounce'
                            >
                                {cartCount}
                            </motion.span>
                        )}
                    </button>
                )}
                {/* Points Badge */}
                <div className='flex-shrink-0 flex items-center justify-center'>
                    <span className='bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-50 text-yellow-900 dark:from-yellow-700 dark:via-yellow-600 dark:to-yellow-400 font-bold rounded-full px-6 py-2 shadow-lg border-2 border-yellow-300 dark:border-yellow-700 text-lg flex items-center gap-1 min-w-[48px] min-h-[48px] justify-center backdrop-blur-md'>
                        {loading ? (
                            <Loader2 className='animate-spin h-5 w-5' />
                        ) : (
                            loyaltyPoints ?? '-'
                        )}
                        <span className='text-xs font-semibold ml-0.5 hidden sm:inline'>
                            نقطة
                        </span>
                    </span>
                </div>
                {/* Profile Avatar & Popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            className='focus:outline-none rounded-full border-2 border-gold/60 shadow-xl hover:scale-110 transition-transform bg-white/90 dark:bg-kian-charcoal/90 border-yellow-200 dark:border-yellow-700'
                            style={{ minWidth: 48, minHeight: 48 }}
                        >
                            <img
                                src={'user?.imageUrl'}
                                alt='profile'
                                className='w-12 h-12 rounded-full object-cover border-2 border-yellow-400 dark:border-yellow-700 shadow-lg'
                            />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className='w-80 p-7 rounded-3xl shadow-2xl bg-white/95 dark:bg-kian-charcoal/95 border-0 flex flex-col items-center gap-4'>
                        <img
                            src={'user?.imageUrl'}
                            alt='profile'
                            className='w-24 h-24 rounded-full object-cover border-4 border-yellow-400 dark:border-yellow-700 shadow-xl mb-2'
                        />
                        <div className='text-center'>
                            <div className='text-2xl font-bold text-kian-burgundy dark:text-gold mb-1'>
                                {user?.email.split('@')[0] || 'ضيف'}
                            </div>
                            <div className='text-sm text-gray-500 dark:text-gray-300'>
                                {user?.email || ''}
                            </div>
                        </div>
                        <div className='mt-2 flex flex-col items-center gap-1'>
                            <span className='text-base font-semibold text-yellow-700 dark:text-yellow-300'>
                                عدد نقاط الولاء:
                            </span>
                            <span className='text-3xl font-extrabold bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-50 text-yellow-900 dark:from-yellow-700 dark:via-yellow-600 dark:to-yellow-400 dark:text-yellow-100 rounded-full px-8 py-3 shadow border-2 border-yellow-300 dark:border-yellow-700 '>
                                {loading ? (
                                    <Loader2 className=' h-6 w-6' />
                                ) : (
                                    loyaltyPoints ?? '-'
                                )}
                            </span>
                        </div>
                        <div className='mt-4 w-full flex justify-center'>
                            {/* <SignOutButton afterSignOutUrl='/signin'>
                            </SignOutButton> */}
                            <button
                                onClick={logout}
                                className='px-7 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold shadow transition text-lg'
                            >
                                تسجيل الخروج
                            </button>
                        </div>
                        {/* Theme & Language Toggle in Dropdown */}
                        <div className='mt-4 w-full flex justify-center'>
                            <ThemeLanguageToggle />
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </nav>
    )
}

export default UserNavbar
