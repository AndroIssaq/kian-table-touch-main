import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useLoading } from '@/contexts/useLoading'

interface TableGridProps {
    onTableSelect: (tableNumber: number) => void
    selectedTable: number | null
}

const TableGrid = ({ onTableSelect, selectedTable }: TableGridProps) => {
    const { loading, setLoading } = useLoading()
    const tables = Array.from({ length: 20 }, (_, i) => i + 1)

    useEffect(() => {
        setLoading(true)
        const timer = setTimeout(() => setLoading(false), 700)
        return () => clearTimeout(timer)
    }, [setLoading])

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    }

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        show: { opacity: 1, scale: 1 },
    }

    return (
        <motion.div
            className='table-grid mb-[250px] mt-[30px]'
            variants={containerVariants}
            initial='hidden'
            animate='show'
        >
            {tables.map((tableNumber) => (
                <motion.div
                    key={tableNumber}
                    variants={itemVariants}
                    className='table-card'
                >
                    <button
                        onClick={() => onTableSelect(tableNumber)}
                        className={`group relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center shadow-xl border-4 transition-all duration-200
              ${
                  selectedTable === tableNumber
                      ? 'bg-gradient-to-br from-gold via-yellow-200 border-gold scale-105 ring-4 ring-gold'
                      : 'bg-gradient-to-br from-white via-gray-100 to-kian-sand border-kian-burgundy hover:scale-105 hover:shadow-2xl'
              }
            `}
                        style={{ perspective: 600 }}
                    >
                        <span
                            className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-200 ${
                                selectedTable === tableNumber
                                    ? 'shadow-[0_0_40px_10px_rgba(255,215,0,0.3)]'
                                    : 'shadow-[0_2px_12px_0px_rgba(0,0,0,0.08)]'
                            }`}
                        ></span>
                        {/* أيقونة ترابيزة SVG عصرية */}
                        <span className='absolute bottom-2 left-1/2 -translate-x-1/2 z-10'>
                            <svg
                                width='38'
                                height='38'
                                viewBox='0 0 38 38'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <ellipse
                                    cx='19'
                                    cy='15'
                                    rx='15'
                                    ry='8'
                                    fill={
                                        selectedTable === tableNumber
                                            ? '#FFD700'
                                            : '#E5E7EB'
                                    }
                                    stroke='#B08D57'
                                    strokeWidth='2'
                                />
                                <rect
                                    x='8'
                                    y='15'
                                    width='22'
                                    height='10'
                                    rx='5'
                                    fill={
                                        selectedTable === tableNumber
                                            ? '#FFF9E3'
                                            : '#F3F4F6'
                                    }
                                    stroke='#B08D57'
                                    strokeWidth='2'
                                />
                                <rect
                                    x='13'
                                    y='25'
                                    width='3'
                                    height='7'
                                    rx='1.5'
                                    fill='#B08D57'
                                />
                                <rect
                                    x='22'
                                    y='25'
                                    width='3'
                                    height='7'
                                    rx='1.5'
                                    fill='#B08D57'
                                />
                            </svg>
                        </span>
                        <span className='relative z-10 text-3xl sm:text-4xl md:text-4xl font-extrabold text-kian-burgundy group-hover:text-gold transition-all duration-200 drop-shadow-lg'>
                            {tableNumber}
                        </span>
                    </button>
                </motion.div>
            ))}
        </motion.div>
    )
}

export default TableGrid
