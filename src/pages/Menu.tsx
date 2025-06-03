import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coffee, Leaf, GlassWater, Sandwich, Pizza, Percent, Martini, Salad, Utensils, CupSoda, Cake, ReceiptText } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeLanguageToggle from "@/components/ThemeLanguageToggle";
import { createClient } from '@supabase/supabase-js';
import UserNavbar from '@/components/UserNavbar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Supabase client setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ثابت للألوان والأيقونات حسب id
const categoryStyles: Record<number, { color: string; icon: any }> = {
  1: { color: "bg-orange-400", icon: Coffee },
  2: { color: "bg-yellow-400", icon: GlassWater },
  3: { color: "bg-pink-500", icon: Leaf },
  4: { color: "bg-red-500", icon: Sandwich },
  5: { color: "bg-purple-500", icon: Utensils },
  6: { color: "bg-green-500", icon: Pizza },
  7: { color: "bg-blue-500", icon: Percent },
  8: { color: "bg-rose-500", icon: Martini },
  9: { color: "bg-lime-500", icon: Salad },
  10: { color: "bg-cyan-500", icon: CupSoda },
  11: { color: "bg-fuchsia-500", icon: Cake },
};

const Menu = () => {
  
  const navigate = useNavigate();
  const location = useLocation();
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  // حالة الفاتورة (محملة من localStorage)
  const [invoice, setInvoice] = useState<any[]>(() => {
    const stored = localStorage.getItem("invoice");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const table = params.get("table") || params.get("tableNumber");
    if (!table) {
      navigate("/choose-table");
    }
  }, [location.search, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const table = params.get("table");
    if (!table) {
      toast({
        title: t("error"),
        description: t("noTable"),
        variant: "destructive",
      });
      navigate("/choose-table");
      return;
    }
    setTableNumber(parseInt(table, 10));
  }, [location.search, navigate, t]);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });
      console.log('Supabase categories data:', data, 'error:', error); // <--- هنا التشخيص
      if (error) {
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: language === 'ar' ? 'حدث خطأ أثناء تحميل التصنيفات' : 'Failed to load categories',
          variant: 'destructive',
        });
        setCategories([]);
      } else {
        setCategories(data || []);
      }
      setLoading(false);
    };
    fetchCategories();
  }, [language]);
console.log("Categories:" ,  categories);


  // زر الفاتورة العائم الموحد
  const InvoiceFloatingButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="fixed bottom-[70px] right-6 z-[100] flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-kian-burgundy font-extrabold text-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105"
      style={{ boxShadow: '0 8px 32px 0 rgba(255, 193, 7, 0.25)' }}
      aria-label="عرض الفاتورة"
    >
      <ReceiptText className="w-6 h-6 mr-1 text-kian-burgundy drop-shadow" />
      <span className="hidden sm:inline">{language === 'ar' ? 'عرض الفاتورة' : 'View Invoice'}</span>
    </button>
  );

  // حفظ الفاتورة في localStorage عند كل تغيير
  useEffect(() => {
    localStorage.setItem("invoice", JSON.stringify(invoice));
  }, [invoice]);

  // زر "تم الدفع" لمسح الفاتورة وإغلاق النافذة
  const handleClearInvoice = () => {
    setInvoice([]);
    localStorage.removeItem("invoice");
    setInvoiceDialogOpen(false);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <PageTransition>
      <UserNavbar cartCount={invoice.length} />
      <div className="min-h-screen bg-gradient-to-br from-[#f6f7fb] via-[#f9f6ff] to-[#e8eaf6] dark:from-[#181a20] dark:via-[#23243a] dark:to-[#181a20] p-0">
        <div className="cafe-container">
          <div className="mb-6 flex justify-between items-center">
            <ThemeLanguageToggle />
            
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-kian-burgundy via-gold to-[#494848] bg-clip-text text-transparent drop-shadow-lg">
            {t("restaurantMenu")}
          </h1>
          <p className="text-center text-kian-charcoal/80 dark:text-kian-sand/80 mb-8">
            {t("table")} {tableNumber}
          </p>
          {/* Categories grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {loading ? (
              <div className="col-span-4 text-center py-8 text-lg font-bold opacity-60">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : categories.length === 0 ? (
              <div className="col-span-4 text-center py-8 text-lg font-bold opacity-60">
                {language === 'ar' ? 'لا توجد بيانات لعرضها' : 'No data to display'}
              </div>
            ) : (
              categories.map((cat, idx) => {
                const style = categoryStyles[cat.id] || { color: "bg-orange-400", icon: Coffee };
                const Icon = style.icon;
                return (
                  <button
                    key={cat.id}
                    style={{
                      animation: `fadeInUp 0.5s ${0.1 * idx}s both`,
                    }}
                    className={`rounded-2xl shadow-lg p-6 flex flex-col items-start justify-between min-h-[110px] transition-all duration-200 cursor-pointer hover:scale-105 active:scale-100 ${style.color}`}
                    onClick={() => navigate(`/menu/category/${cat.id}?table=${tableNumber}`)}
                  >
                    <span className="flex items-center gap-2 mb-2">
                      <Icon className="w-6 h-6 text-white/90 drop-shadow" />
                      <span className="text-lg font-bold">{language === 'ar' ? cat.name_ar : cat.name_en}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
      <InvoiceFloatingButton onClick={() => setInvoiceDialogOpen(true)} />
      {/* نافذة الفاتورة */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-lg w-full rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-kian-burgundy dark:text-gold">
              {language === 'ar' ? 'فاتورة المشتريات' : 'Purchase Invoice'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center">
              <thead>
                <tr className="bg-gold/20">
                  <th>{language === 'ar' ? 'المنتج' : 'Item'}</th>
                  <th>{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                  <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
                  <th>{language === 'ar' ? 'السعر' : 'Price'}</th>
                  <th>{language === 'ar' ? 'النقاط' : 'Points'}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-gray-400">{language === 'ar' ? 'لا توجد مشتريات بعد' : 'No purchases yet'}</td></tr>
                ) : (
                  invoice.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.name}</td>
                      <td>{row.quantity}</td>
                      <td>{row.type === 'loyalty' ? (language === 'ar' ? 'نقاط' : 'Loyalty') : (language === 'ar' ? 'نقدي' : 'Cash')}</td>
                      <td>{row.type === 'cash' ? `${row.price} EGP` : '-'}</td>
                      <td>{row.type === 'loyalty' ? row.points : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* الإجمالي */}
          <div className="mt-4 text-lg font-bold text-right">
            {language === 'ar' ? 'الإجمالي المطلوب دفعه:' : 'Total to Pay:'} {invoice.filter(i => i.type === 'cash').reduce((sum, i) => sum + (i.price * i.quantity), 0)} EGP
          </div>
          {/* زر تم الدفع */}
          <div className="flex justify-center mt-6">
            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-2 rounded-full" onClick={handleClearInvoice}>
              {language === 'ar' ? 'تم الدفع' : 'Paid'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* زر الرجوع الصغير أعلى الصفحة */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-[100] w-10 h-10 lg:flex items-center justify-center rounded-full shadow bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all duration-150 hidden sm:flex"
        style={{ boxShadow: '0 4px 16px 0 rgba(120,120,120,0.10)' }}
        aria-label={language === 'ar' ? 'الرجوع' : 'Back'}
      >
        <ArrowLeft className="w-5 h-5 text-kian-burgundy" />
      </button>
    </PageTransition>
  );
};

export default Menu;

/* أضف كود CSS للأنيميشن في أعلى الملف أو في ملف CSS عام:
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
*/
