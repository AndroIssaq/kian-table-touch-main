import { Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Song {
    src: string
    name: string
}

interface MusicPlayerProps {
    currentSong: Song
    isPlaying: boolean
    language: string
    onTogglePlay: () => void
    onPlayRandom: () => void
}

const MusicPlayer = ({
    currentSong,
    isPlaying,
    language,
    onTogglePlay,
    onPlayRandom,
}: MusicPlayerProps) => {
    return (
        <Card className='w-full flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl shadow-lg bg-gradient-to-r from-[#f9f6ff] to-[#fff8f0] dark:from-[#23243a] dark:to-[#181a20]'>
            <Music className='w-10 h-10 text-gold mb-2' />
            <div className='font-bold text-base sm:text-lg mb-1 text-center'>
                {language === 'ar'
                    ? 'هل تود سماع الموسيقى اثناء انتظار طلبك ؟'
                    : 'Would you like to listen to music while waiting for your order?'}
            </div>
            <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-center items-center'>
                <div className='text-xs text-gray-500 mb-1 sm:mb-0'>
                    {language === 'ar' ? 'الأغنية الحالية:' : 'Now Playing:'}{' '}
                    <span className='font-bold text-kian-burgundy dark:text-gold'>
                        {currentSong.name}
                    </span>
                </div>
                <div className='flex gap-2'>
                    <Button
                        variant='outline'
                        className='rounded-full px-6 py-2 flex items-center gap-2 text-gold border-gold hover:bg-gold/10'
                        onClick={onTogglePlay}
                    >
                        {isPlaying ? (
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='w-5 h-5'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <rect
                                    x='6'
                                    y='6'
                                    width='12'
                                    height='12'
                                    rx='2'
                                />
                            </svg>
                        ) : (
                            <Music className='w-5 h-5' />
                        )}
                        {isPlaying
                            ? language === 'ar'
                                ? 'إيقاف الموسيقى'
                                : 'Pause Music'
                            : language === 'ar'
                            ? 'تشغيل الموسيقى'
                            : 'Play Music'}
                    </Button>
                    <Button
                        variant='outline'
                        className='rounded-full px-4 py-2 flex items-center gap-2 text-gold border-gold hover:bg-gold/10'
                        onClick={onPlayRandom}
                        aria-label={
                            language === 'ar' ? 'تغيير الأغنية' : 'Change Song'
                        }
                    >
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='w-5 h-5'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M4 4v16h16M4 4l16 16'
                            />
                        </svg>
                        {language === 'ar' ? 'تغيير الأغنية' : 'Change Song'}
                    </Button>
                </div>
            </div>
            <audio
                id='cafe-music'
                src={currentSong.src}
                preload='auto'
                style={{ display: 'none' }}
            />
        </Card>
    )
}

export default MusicPlayer
