import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import ThemeLanguageToggle from "@/components/ThemeLanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useUser } from '@clerk/clerk-react';
import UserNavbar from '@/components/UserNavbar';
import { useCart } from '@/contexts/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useLoyaltyPoints } from '@/contexts/LoyaltyPointsContext';
import { ReceiptText } from "lucide-react";

const categoryNames = {
  1: { ar: "مشروبات ساخنة", en: "Hot Drinks" },
  2: { ar: "مشروبات فريش", en: "Fresh Drinks" },
  3: { ar: "سموزي", en: "Smoothies" },
  4: { ar: "برجرز", en: "Burgers" },
  5: { ar: "مكرونات", en: "Pasta" },
  6: { ar: "بيتزا", en: "Pizza" },
  7: { ar: "خصومات", en: "Discounts" },
  8: { ar: "كوكتيلات", en: "Cocktails" },
  9: { ar: "سلاطات", en: "Salads" },
  10: { ar: "مقبلات", en: "Appetizers" },
  11: { ar: "حلويات", en: "Desserts" },
};

export default function CategoryMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const table = Number(new URLSearchParams(location.search).get("table"));
  const { t, language } = useLanguage();
  const { user } = useUser();
  const { points, setPoints, refreshPoints } = useLoyaltyPoints();

  // تحويل id إلى رقم صحيح لاستخدامه كمفتاح
  const numericId = Number(id);
  const catName = categoryNames[numericId as keyof typeof categoryNames]?.[language] || "";

  // جلب الداتا من supabase
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // إضافة حالة للسلة
  const [cartOpen, setCartOpen] = useState(false);
  const { addToCart, cart, clearCart } = useCart();

  // إضافة حالة لعرض نافذة التأكيد
  const [confirmLoyaltyDialog, setConfirmLoyaltyDialog] = useState<{ open: boolean, item: any | null }>({ open: false, item: null });

  // إضافة حالتين جديدتين للتحكم في نافذة التأكيد والمنتج المختار
  const [confirmLoyaltyDialogOpen, setConfirmLoyaltyDialogOpen] = useState(false);
  const [selectedLoyaltyItem, setSelectedLoyaltyItem] = useState<any>(null);

  // حالة جديدة للفاتورة (محملة من localStorage)
  const [invoice, setInvoice] = useState<any[]>(() => {
    const stored = localStorage.getItem("invoice");
    return stored ? JSON.parse(stored) : [];
  });
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  // حفظ الفاتورة في localStorage عند كل تغيير
  useEffect(() => {
    localStorage.setItem("invoice", JSON.stringify(invoice));
  }, [invoice]);

  useEffect(() => {
    if (!table) {
      navigate("/choose-table");
      return;
    }
    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("items")
        .select("*")
        .eq("category_id", numericId)
        .order("id", { ascending: true });
      if (error) {
        toast({
          title: language === "ar" ? "خطأ" : "Error",
          description: language === "ar" ? "حدث خطأ أثناء تحميل العناصر" : "Failed to load items",
          variant: "destructive",
        });
        setItems([]);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    };
    if (numericId) fetchItems();
  }, [numericId, language]);

  // جلب نقاط الولاء عند تحميل الصفحة أو تغيير المستخدم
  useEffect(() => {
    const fetchLoyaltyPoints = async () => {
      if (!user) return;
      const { data, error } = await (supabase as any)
        .from('loyalty_visits')
        .select('points')
        .eq('user_id', user.id)
        .single();
      if (!error && data) {
        setPoints(data.points);
      }
    };
    fetchLoyaltyPoints();
  }, [user]);

  const handleOrder = (item: any) => {
    addToCart({
      name: item[`name_${language}`],
      price: Number(item.price),
      quantity: 1,
    });
    setCartOpen(true);
    toast({
      title: language === 'ar' ? 'تمت الإضافة للسلة' : 'Added to cart',
      description: item[`name_${language}`],
      duration: 2000,
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const table = params.get("table") || params.get("tableNumber");
    if (!table) {
      navigate("/choose-table");
    }
  }, [location.search, navigate]);

  // حذف عنصر واحد من السلة
  const handleRemoveItem = (idx: number) => {
    const newCart = [...cart];
    newCart.splice(idx, 1);
    // استخدم دالة clearCart ثم أضف العناصر المتبقية
    clearCart();
    newCart.forEach(item => addToCart(item));
  };

  // تأكيد الطلب وإرساله إلى supabase
  const handleConfirmOrder = async () => {
    if (!cart.length) return;
    try {
      for (const item of cart) {
        await (supabase as any).from('waiter_requests').insert([
          {
            table_number: table,
            request: `${item.name} x${item.quantity}`,
            status: 'new',
            created_at: new Date().toISOString(),
            deleted: false,
            user_id: user?.id,
            user_name: user?.fullName || user?.username || user?.emailAddresses?.[0]?.emailAddress || '',
          }
        ]);
        // أضف للفاتورة
        setInvoice((prev: any[]) => [
          ...prev,
          {
            name: item.name,
            quantity: item.quantity,
            type: 'cash',
            price: item.price,
            points: null,
          }
        ]);
      }
      toast({
        title: language === 'ar' ? 'تم إرسال الطلب' : 'Order sent',
        description: language === 'ar' ? 'تم إرسال طلبك بنجاح وسيظهر للنادل.' : 'Your order has been sent and will appear to the staff.',
        duration: 3000,
      });
      clearCart();
      setCartOpen(false);
    } catch (err) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء إرسال الطلب.' : 'Failed to send order.',
        variant: 'destructive',
      });
    }
  };

  // شراء المنتج بنقاط الولاء (يتم استدعاؤها فقط بعد التأكيد)
  const handleBuyWithPoints = async (item: any) => {
    // استخدم اسم متغير مختلف لتفادي التعارض
    const selectedItem = item;
    if (!user || !selectedItem) return;
    let userPoints = points;
    if (userPoints === null) {
      await refreshPoints();
      userPoints = points;
    }
    // غير اسم المتغير هنا أيضاً
    const { data: itemPointsData, error: itemError } = await (supabase as any)
      .from('items')
      .select('points')
      .eq('id', selectedItem.id)
      .single();
    if (itemError || !itemPointsData) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'تعذر جلب نقاط المنتج.' : 'Failed to fetch item points.',
        variant: 'destructive',
      });
      setConfirmLoyaltyDialog({ open: false, item: null });
      return;
    }
    const itemPoints = itemPointsData.points || 0;
    if (userPoints < itemPoints) {
      toast({
        title: language === 'ar' ? 'نقاط غير كافية' : 'Not enough points',
        description: language === 'ar' ? 'نقاط الولاء لا تكفي لشراء هذا المنتج.' : 'You do not have enough loyalty points to buy this item.',
        variant: 'destructive',
      });
      setConfirmLoyaltyDialog({ open: false, item: null });
      return;
    }
    const { error: updateError } = await (supabase as any)
      .from('loyalty_visits')
      .update({ points: userPoints - itemPoints })
      .eq('user_id', user.id);
    if (updateError) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء خصم النقاط.' : 'Failed to deduct points.',
        variant: 'destructive',
      });
      setConfirmLoyaltyDialog({ open: false, item: null });
      return;
    }
    setPoints(userPoints - itemPoints);
    // أضف للفاتورة
    setInvoice((prev: any[]) => [
      ...prev,
      {
        name: selectedItem[`name_${language}`],
        quantity: 1,
        type: 'loyalty',
        price: 0,
        points: itemPoints,
      }
    ]);
    await refreshPoints();
    const { error: insertError } = await supabase.from('waiter_requests').insert([
      {
        table_number: table,
        request: `${selectedItem[`name_${language}`]} (شراء بنقاط الولاء)`,
        status: 'new',
        created_at: new Date().toISOString(),
        deleted: false,
        user_id: user.id,
        user_name: user.fullName || user.username || user.emailAddresses?.[0]?.emailAddress || '',
      }
    ]);
    if (insertError) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'تم خصم النقاط لكن حدث خطأ في تسجيل الطلب.' : 'Points deducted but failed to register order.',
        variant: 'destructive',
      });
      setConfirmLoyaltyDialog({ open: false, item: null });
      return;
    }
    toast({
      title: language === 'ar' ? 'تم الشراء بنجاح' : 'Purchase successful',
      description: language === 'ar' ? `تم خصم ${itemPoints} نقطة من رصيدك.` : `${itemPoints} points have been deducted from your balance.`,
      duration: 3000,
    });
    setConfirmLoyaltyDialog({ open: false, item: null });
  };

  const handleOpenLoyaltyDialog = (item: any) => {
    setSelectedLoyaltyItem(item);
    setConfirmLoyaltyDialogOpen(true);
  };

  // زر "تم الدفع" لمسح الفاتورة وإغلاق النافذة
  const handleClearInvoice = () => {
    setInvoice([]);
    localStorage.removeItem("invoice");
    setInvoiceDialogOpen(false);
  };

  // زر الفاتورة العائم الموحد
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <PageTransition>
      <UserNavbar cartCount={cart.length} />
      {/* تمت إزالة سلة الشراء (Cart) وزرها من صفحة تصنيفات المنيو */}
      {/* نافذة تأكيد شراء المنتج بنقاط الولاء */}
      <Dialog open={confirmLoyaltyDialogOpen} onOpenChange={setConfirmLoyaltyDialogOpen}>
        <DialogContent className="max-w-sm w-full rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
              {language === 'ar' ? 'تأكيد الشراء بنقاط الولاء' : 'Confirm Loyalty Points Purchase'}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center text-base mb-4">
            {selectedLoyaltyItem && (
              <>
                {language === 'ar'
                  ? `هل أنت متأكد أنك تريد شراء "${selectedLoyaltyItem[`name_ar`]}" مقابل ${selectedLoyaltyItem.points} نقطة؟`
                  : `Are you sure you want to buy "${selectedLoyaltyItem[`name_en`]}" for ${selectedLoyaltyItem.points} points?`}
              </>
            )}
          </div>
          <DialogFooter className="flex gap-2 justify-center">
            <Button
              variant="secondary"
              onClick={() => setConfirmLoyaltyDialogOpen(false)}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold"
              onClick={async () => {
                if (selectedLoyaltyItem) {
                  await handleBuyWithPoints(selectedLoyaltyItem);
                }
                setConfirmLoyaltyDialogOpen(false);
                setSelectedLoyaltyItem(null);
              }}
            >
              {language === 'ar' ? 'تأكيد الشراء' : 'Confirm Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* زر الفاتورة العائم الموحد */}
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
        className="fixed top-6 left-6 z-[100] w-10 h-10 flex items-center justify-center rounded-full shadow bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all duration-150 hidden sm:flex"
        style={{ boxShadow: '0 4px 16px 0 rgba(120,120,120,0.10)' }}
        aria-label={language === 'ar' ? 'الرجوع' : 'Back'}
      >
        <ArrowLeft className="w-5 h-5 text-kian-burgundy" />
      </button>
      <div className="cafe-container">
        <div className="mb-6 flex justify-between items-center">
          <ThemeLanguageToggle />
         
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-kian-burgundy via-gold to-[#494848] bg-clip-text text-transparent drop-shadow-lg">
          {catName}
        </h1>
        <p className="text-center text-kian-charcoal/80 dark:text-kian-sand/80 mb-8">
          {t("table")} {table}
        </p>
        {/* عرض نقاط الولاء */}
        <div className="flex justify-end items-center gap-2 mb-2">
          <span className="font-bold text-yellow-700 dark:text-yellow-300">
            {language === 'ar' ? 'نقاطك:' : 'Your Points:'} {points ?? '--'}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-lg text-kian-charcoal/60 dark:text-kian-sand/60 py-12">
              {language === "ar" ? "جاري التحميل..." : "Loading..."}
            </div>
          ) : items.length === 0 ? (
            <div className="col-span-full text-center text-lg text-kian-charcoal/60 dark:text-kian-sand/60 py-12">
              {language === "ar" ? "لا توجد عناصر في هذا القسم حالياً" : "No items in this category yet."}
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-2xl shadow-lg bg-white/80 dark:bg-kian-charcoal/80 p-4 flex flex-col items-center transition-all duration-200 hover:scale-105">
                {item.image_url && item.image_url.trim() !== '' && (
                  <img
                    src={item.image_url && (item.image_url.startsWith('http') || item.image_url.startsWith('/'))
                      ? item.image_url
                      : `/images/${item.image_url}`}
                    alt={item[`name_${language}`]}
                    className="w-24 h-24 object-cover rounded-xl mb-3 border border-gold/30"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="text-lg font-bold mb-1 text-center text-kian-burgundy dark:text-gold">
                  {item[`name_${language}`]}
                </div>
                <div className="text-base text-kian-charcoal/80 dark:text-kian-sand/80 mb-2">
                  {item.price} EGP
                </div>
                {item[`description_${language}`] && (
                  <div className="text-xs text-gray-500 dark:text-gray-300 mb-2 text-center">
                    {item[`description_${language}`]}
                  </div>
                )}
                <Button variant="outline" className="w-full mt-auto" onClick={() => handleOrder(item)}>
                  {language === "ar" ? "أضف للسلة" : "Add to cart"}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full mt-2 text-wrap text bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold text-xs border border-yellow-300 px-2 py-1 md:text-sm md:px-4 md:py-2 transition-all duration-200"
                  disabled={!item.points || item.points <= 0}
                  onClick={() => handleOpenLoyaltyDialog(item)}
                >
                  {language === "ar"
                    ? `اشتري بنقاط الولاء (${item.points ?? 0} نقطة)`
                    : `Buy with Loyalty Points (${item.points ?? 0} pts)`}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
}