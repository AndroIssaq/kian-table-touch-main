import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import TableGrid from '@/components/TableGrid'
import PageTransition from '@/components/PageTransition'
import { useLanguage } from '@/contexts/useLanguage'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/components/ui/use-toast'
import { Home, Menu } from 'lucide-react'

const ChooseTable = () => {
    const [selectedTable, setSelectedTable] = useState<number | null>(null)
    const [confirmed, setConfirmed] = useState(false)
    const { t, language } = useLanguage()
    const navigate = useNavigate()

    useEffect(() => {
        try {
            const savedTable = localStorage.getItem('selectedTable')
            if (savedTable) {
                setSelectedTable(Number(savedTable))
                setConfirmed(true)
            }
        } catch (error) {
            console.error('Error checking saved table:', error)
        }
    }, [navigate])
    const handleTableSelect = (tableNumber: number) => {
        setSelectedTable(tableNumber === selectedTable ? null : tableNumber)
    }
    const confirmTableSelect = (tableNumber: number | null) => {
        if (!tableNumber) {
            alert('Please select a table first')
            return
        }

        try {
            localStorage.setItem('selectedTable', tableNumber.toString())
            setConfirmed(true)
        } catch (error) {
            console.error('Error saving table number:', error)
            alert('Failed to save table selection. Please try again.')
        }
    }
    const handleAction = (action: 'user-home' | 'menu') => {
        if (!selectedTable) {
            toast({
                title: t('tableRequired'),
                description: t('pleaseSelect'),
                variant: 'destructive',
            })
            return
        }
        navigate(`/${action}?table=${selectedTable}`)
    }
    const unConfirmTableSelect = () => {
        setSelectedTable(null)
        setConfirmed(false)
        localStorage.removeItem('selectedTable')
    }
    return (
        <PageTransition>
            <div className='cafe-container mt-[100px]'>
                <header>
                    <motion.h1
                        className='text-3xl md:text-4xl font-bold text-center mb-2 text-gradient'
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {t('welcome')}
                    </motion.h1>
                    <motion.p
                        className='text-center mt-[30px] text-kian-charcoal/80 dark:text-kian-sand/80 mb-8'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        {t('selectTable')}
                    </motion.p>
                </header>
                {!confirmed ? (
                    <TableGrid
                        onTableSelect={handleTableSelect}
                        selectedTable={selectedTable}
                    />
                ) : (
                    <>
                        <motion.div
                            className='text-center dark:bg-[#fff] bg-black rounded-[20px] text-[20px] font-bold p-[10px] mt-6 dark:text-black text-white'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            {`${t('tableSelected')} ${selectedTable}`}
                        </motion.div>
                        <div className='flex-col items-center justify-center space-y-4 mt-6'>
                            <Button
                                className='action-button w-full bg-black hover:bg-black/90 dark:bg-gold dark:hover:bg-gold/90 dark:text-black h-16 text-lg text-white'
                                onClick={unConfirmTableSelect}
                            >
                                change the table selected
                            </Button>
                            <Button
                                className='action-button w-full bg-black hover:bg-black/90 dark:bg-gold dark:hover:bg-gold/90 dark:text-black h-16 text-lg text-white'
                                onClick={() => handleAction('user-home')}
                            >
                                <Home
                                    className={`${
                                        language === 'ar' ? 'ml-2' : 'mr-2'
                                    } h-5 w-5`}
                                />
                                {t('userHome')}
                            </Button>

                            <Button
                                className='action-button w-full bg-gold hover:bg-gold/90 text-black dark:bg-black dark:hover:bg-black/90 dark:text-gold h-16 text-lg'
                                onClick={() => handleAction('menu')}
                            >
                                <Menu
                                    className={`${
                                        language === 'ar' ? 'ml-2' : 'mr-2'
                                    } h-5 w-5`}
                                />
                                {t('viewMenu')}
                            </Button>
                        </div>
                    </>
                )}

                <div className='w-full mb-8'>
                    {selectedTable && (
                        <motion.div
                            className='flex items-center justify-center w-full '
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className='fixed bottom-[5%] xl:w-[50%] lg:w-[50%] md:w-[50%] sm:w-[90%] w-[90%] flex-col items-center justify-center space-y-4 mt-6'>
                                {!confirmed && (
                                    <Button
                                        className='action-button w-full bg-black hover:bg-black/90 dark:bg-gold dark:hover:bg-gold/90 dark:text-black h-16 text-lg text-white'
                                        onClick={() =>
                                            confirmTableSelect(selectedTable)
                                        }
                                    >
                                        Confirm Selected Table NO.
                                        <span className='text-kian-gold'>
                                            {selectedTable}
                                        </span>
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </PageTransition>
    )
}

export default ChooseTable
