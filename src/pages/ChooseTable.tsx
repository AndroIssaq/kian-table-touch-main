import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TableGrid from "@/components/TableGrid";
import ActionButtons from "@/components/ActionButtons";
import PageTransition from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserNavbar } from '@/components/UserNavbar';

const ChooseTable = () => {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const { t, language } = useLanguage();
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTableSelect = (tableNumber: number) => {
    setSelectedTable(tableNumber === selectedTable ? null : tableNumber);
  };

  return (
    <PageTransition>
      <UserNavbar cartCount={0} />
      <div className="cafe-container mt-[100px]">
        <header>
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-center mb-2 text-gradient"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t("welcome")}
          </motion.h1>
          <motion.p 
            className="text-center mt-[30px] text-kian-charcoal/80 dark:text-kian-sand/80 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {t("selectTable")}
          </motion.p>
          {selectedTable && (
            <motion.div 
              className="text-center dark:bg-[#fff] bg-black rounded-[20px] text-[20px] font-bold p-[10px] mt-6 dark:text-black text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {`${t("tableSelected")} ${selectedTable}`}
            </motion.div>
          )}
        </header>
        <TableGrid 
          onTableSelect={handleTableSelect} 
          selectedTable={selectedTable} 
        />
        <div className="w-full mb-8">
          <ActionButtons selectedTable={selectedTable} />
        </div>
      </div>
    </PageTransition>
  );
};

export default ChooseTable;
