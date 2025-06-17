import { motion, AnimatePresence } from 'framer-motion'

interface WelcomeAnimationProps {
    show: boolean
    userName: string
    language: string
}

const WelcomeAnimation = ({
    show,
    userName,
    language,
}: WelcomeAnimationProps) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    key='golden-welcome'
                    initial={{ opacity: 0, scale: 0.7, y: 60 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        filter: 'drop-shadow(0 0 40px #FFD700cc)',
                    }}
                    exit={{ opacity: 0, scale: 0.7, y: -60 }}
                    transition={{
                        duration: 0.9,
                        type: 'spring',
                        bounce: 0.32,
                    }}
                    className='fixed inset-0 z-[200] flex items-center justify-center bg-transparent pointer-events-none'
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -40 }}
                        transition={{
                            duration: 0.7,
                            type: 'spring',
                            bounce: 0.3,
                            delay: 0.1,
                        }}
                        className='bg-white/90 dark:bg-[#23243ad9] rounded-3xl shadow-2xl border-2 border-yellow-200 px-8 py-10 sm:px-14 sm:py-12 flex flex-col items-center max-w-[95vw] w-full sm:w-[420px] pointer-events-auto'
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: -30 }}
                            transition={{
                                duration: 1.2,
                                delay: 0.5,
                                repeat: Infinity,
                                repeatType: 'reverse',
                                ease: 'easeInOut',
                            }}
                            className='absolute left-1/2 -translate-x-1/2 -top-8'
                        >
                            <svg
                                width='40'
                                height='60'
                                viewBox='0 0 40 60'
                                fill='none'
                            >
                                <path
                                    d='M20 50 Q22 40 18 30 Q16 25 20 20'
                                    stroke='#FFD700'
                                    strokeWidth='3'
                                    strokeLinecap='round'
                                    fill='none'
                                />
                            </svg>
                        </motion.div>
                        <span className='inline-block text-[70px] sm:text-[90px] animate-bounce-slow drop-shadow-2xl select-none mb-2'>
                            ☕
                        </span>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: 0.4,
                                duration: 0.7,
                                type: 'spring',
                                bounce: 0.3,
                            }}
                            className='text-2xl sm:text-3xl font-extrabold text-kian-burgundy dark:text-gold text-center mb-2 flex items-center gap-2'
                        >
                            <motion.span
                                initial={{
                                    x: -30,
                                    opacity: 0,
                                    rotate: -10,
                                }}
                                animate={{ x: 0, opacity: 1, rotate: 0 }}
                                transition={{
                                    delay: 0.7,
                                    duration: 0.5,
                                    type: 'spring',
                                    bounce: 0.4,
                                }}
                                className='inline-block text-3xl sm:text-4xl'
                                role='img'
                                aria-label='wave'
                            >
                                👋
                            </motion.span>
                            <span
                                className='bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-200 bg-clip-text text-transparent drop-shadow-lg dark:text-yellow-200 dark:bg-none dark:bg-none dark:drop-shadow-lg'
                                style={{
                                    WebkitTextStroke: '0.5px #a67c00',
                                    textShadow:
                                        '0 2px 8px #fffbe7, 0 1px 0 #a67c00',
                                }}
                            >
                                {language === 'ar'
                                    ? `أهلاً بيك يا ${userName} 👑`
                                    : `Welcome, ${userName} 👑`}
                            </span>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: 1,
                                duration: 0.7,
                                type: 'spring',
                                bounce: 0.25,
                            }}
                            className='text-base sm:text-lg font-bold mt-2 drop-shadow text-center text-yellow-800 dark:text-yellow-200'
                            style={{
                                textShadow:
                                    '0 2px 8px #fffbe7, 0 1px 0 #a67c00',
                            }}
                        >
                            {language === 'ar'
                                ? 'نتمنى لك تجربة ذهبية في مثال كافيه'
                                : 'Wishing you a golden experience at Kayan Cafe!'}
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default WelcomeAnimation
