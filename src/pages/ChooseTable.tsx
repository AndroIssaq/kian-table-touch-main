import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TableGrid from "@/components/TableGrid";
import ActionButtons from "@/components/ActionButtons";
import PageTransition from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ReceiptText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import {UserNavbar} from '@/components/UserNavbar';

const ChooseTable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [loyaltyResult, setLoyaltyResult] = useState<{points: number, reward?: string, found: boolean} | null>(null);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  const { t, language } = useLanguage();
  const { cart, clearCart } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  // حساب مجموع الأسعار
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // استخراج رقم الترابيزة من ال query string
  const tableParam = new URLSearchParams(location.search).get("table");

  useEffect(() => {
    // إذا فيه رقم ترابيزة في ال URL، ننتقل مباشرة للمنيو أو الصفحة التالية
    if (tableParam) {
      navigate(`/Menu?table=${tableParam}`);
    }
  }, [tableParam, navigate]);

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

  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  const handleTableSelect = (tableNumber: number) => {
    setSelectedTable(tableNumber === selectedTable ? null : tableNumber);
  };

  const InvoiceFloatingButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-kian-burgundy font-extrabold text-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105"
      style={{ boxShadow: '0 8px 32px 0 rgba(255, 193, 7, 0.25)' }}
      aria-label="عرض الفاتورة"
    >
      <ReceiptText className="w-6 h-6 mr-1 text-kian-burgundy drop-shadow" />
      <span className="hidden sm:inline">{language === 'ar' ? 'عرض الفاتورة' : 'View Invoice'}</span>
    </button>
  );

  return (
    <PageTransition>
      <UserNavbar cartCount={cart.length} onCartClick={() => setCartOpen(true)} />
      {/* نافذة السلة */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-md w-full rounded-2xl shadow-2xl bg-gradient-to-br from-white via-[#f9f6ff] to-[#e8eaf6] dark:from-[#23243a] dark:via-[#181a20] dark:to-[#23243a] border-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-kian-burgundy dark:text-gold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" /> سلة الطلبات
            </DialogTitle>
          </DialogHeader>
          {cart.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-lg flex flex-col items-center gap-2">
              <ShoppingCart className="h-12 w-12 opacity-30 mb-2" />
              السلة فارغة
            </div>
          ) : (
            <div>
              <ul className="divide-y divide-kian-sand/30 dark:divide-kian-burgundy/30 mb-4">
                {cart.map((item, idx) => (
                  <li key={idx} className="flex flex-col md:flex-row md:justify-between py-3 px-2 rounded-xl hover:bg-kian-sand/10 dark:hover:bg-kian-burgundy/10 transition-all mb-2">
                    <div className="flex-1">
                      <span className="font-bold text-kian-burgundy dark:text-gold">{item.name}</span>
                      <span className="text-xs text-gray-400 ml-2">x{item.quantity}</span>
                      {item.note && (
                        <div className="text-xs text-kian-charcoal/60 dark:text-kian-sand/60 mt-1 italic">{item.note}</div>
                      )}
                    </div>
                    <span className="font-bold text-lg text-kian-charcoal dark:text-gold self-end md:self-center">{item.price * item.quantity} ج.م</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center font-bold text-xl border-t pt-4 mt-2">
                <span>الإجمالي</span>
                <span className="text-kian-burgundy dark:text-gold">{cartTotal} ج.م</span>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col gap-2">
            <div className="flex w-full gap-2">
              <Button variant="destructive" className="flex-1" onClick={clearCart}>
                🗑️ مسح السلة
              </Button>
              <Button className="flex-1" onClick={() => setCartOpen(false)}>
                إغلاق
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    
      <div className="cafe-container mt-[25px]">
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
              {language === "en" ? `${t("tableSelected")} ${selectedTable}` : `${t("tableSelected")} ${selectedTable}`}
            </motion.div>
          )}
        </header>
        <TableGrid 
          onTableSelect={handleTableSelect} 
          selectedTable={selectedTable} 
        />
        <div className="w-full mb-8">
          <ActionButtons selectedTable={selectedTable} tableNumber={tableParam || selectedTable} />
        </div>
        <InvoiceFloatingButton onClick={() => setInvoiceDialogOpen(true)} />
      </div>
    </PageTransition>
  );
};

export default ChooseTable;
