import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Coffee, Wifi, Gift, Music, Receipt, Bell, ReceiptText } from "lucide-react";
import { UserNavbar } from "@/components/UserNavbar";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { createClient } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import DrinkRecomaindationSystem from "./drinkRecomaindationSystem";
// All loyalty logic is now points-based only. Removed any references to gift-based rewards.

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.13, duration: 0.5, type: "spring", stiffness: 60 },
  }),
};

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const UserHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const params = new URLSearchParams(location.search);
  const table = params.get("table");

  // Enforce table number in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const table = params.get("table") || params.get("tableNumber");
    if (!table) navigate("/choose-table");
  }, [location.search, navigate]);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('waiter_requests')
        .select('id, created_at, request')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        const filtered = data.filter((order: any) => {
          const req = order.request?.trim();
          return req && !req.includes('لا توجد طلبات سابقة') && !req.includes('لا يوجد طلب محدد');
        }).slice(0, 3);
        setRecentOrders(filtered);
      }
    };
    fetchRecentOrders();
  }, [user?.id]);

  // عروض اليوم (ثنائي اللغة)
  const slides = [
    { emoji: "🥤", title: { ar: "خصم 10% على كل المشروبات", en: "10% off all drinks" }, desc: { ar: "ساري اليوم فقط", en: "Valid today only" } },
    { emoji: "🎁", title: { ar: "مشروب مجاني عند كل 5 طلبات", en: "Free drink with every 5 orders" }, desc: { ar: "اسأل عن نقاط الولاء", en: "Ask about loyalty points" } },
    { emoji: "☕", title: { ar: "عرض خاص على القهوة التركي", en: "Special offer on Turkish coffee" }, desc: { ar: "جربها اليوم بسعر مميز", en: "Try it today at a special price" } },
    { emoji: "🍪", title: { ar: "كوكيز مجاني مع كل مشروب ساخن", en: "Free cookie with every hot drink" }, desc: { ar: "لفترة محدودة", en: "For a limited time" } },
    { emoji: "🍰", title: { ar: "خصم 20% على جميع الحلويات", en: "20% off all desserts" }, desc: { ar: "جرب التشيز كيك اليوم", en: "Try the cheesecake today" } },
    { emoji: "🧋", title: { ar: "مشروب بوبا جديد!", en: "New Boba drink!" }, desc: { ar: "نكهات متعددة متوفرة", en: "Multiple flavors available" } },
    { emoji: "🥗", title: { ar: "سلطة فريش مجانية مع كل وجبة", en: "Free fresh salad with every meal" }, desc: { ar: "صحية وخفيفة", en: "Healthy and light" } },
    { emoji: "🎶", title: { ar: "حفلة موسيقية مباشرة الليلة", en: "Live music party tonight" }, desc: { ar: "ابدأ السهرة مع أصدقائك!", en: "Start the night with your friends!" } },
    { emoji: "🧁", title: { ar: "كاب كيك مجاني للأطفال", en: "Free cupcake for kids" }, desc: { ar: "كل يوم جمعة وسبت", en: "Every Friday and Saturday" } },
    { emoji: "☀️", title: { ar: "خصم خاص للفطار المبكر", en: "Special discount for early breakfast" }, desc: { ar: "من 8 صباحًا حتى 11 صباحًا", en: "From 8am to 11am" } },
  ];

  // اقتراحات (ثنائي اللغة)
  const suggestions = [
    { emoji: "🍰", title: { ar: "جرب التشيز كيك مع القهوة", en: "Try cheesecake with coffee" }, desc: { ar: "طبق اليوم المميز", en: "Today's special dish" } },
    { emoji: "🧋", title: { ar: "جرب مشروب البوبا الجديد", en: "Try the new Boba drink" }, desc: { ar: "نكهات متعددة", en: "Multiple flavors" } },
    { emoji: "🥗", title: { ar: "سلطة فريش مع كل وجبة", en: "Fresh salad with every meal" }, desc: { ar: "صحية وخفيفة", en: "Healthy and light" } },
  ];

  // حالة الفاتورة (محملة من localStorage)
  const [invoice, setInvoice] = useState<any[]>(() => {
    const stored = localStorage.getItem("invoice");
    return stored ? JSON.parse(stored) : [];
  });
  // حفظ الفاتورة في localStorage عند كل تغيير
  useEffect(() => {
    localStorage.setItem("invoice", JSON.stringify(invoice));
  }, [invoice]);

  const InvoiceFloatingButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="fixed bottom-[80px] sm:bottom-4 right-6 z-[100] flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-kian-burgundy font-extrabold text-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105"
      style={{ boxShadow: '0 8px 32px 0 rgba(255, 193, 7, 0.25)' }}
      aria-label="عرض الفاتورة"
    >
      <ReceiptText className="w-6 h-6 mr-1 text-kian-burgundy drop-shadow" />
      <span className="hidden sm:inline">{language === 'ar' ? 'عرض الفاتورة' : 'View Invoice'}</span>
    </button>
  );

  // إعادة تحميل الفاتورة من localStorage عند فتح نافذة الفاتورة
  useEffect(() => {
    if (invoiceDialogOpen) {
      const stored = localStorage.getItem("invoice");
      setInvoice(stored ? JSON.parse(stored) : []);
    }
  }, [invoiceDialogOpen]);

  // تحديث الفاتورة فوراً عند أي تغيير في localStorage (حتى من صفحات أخرى)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "invoice") {
        const stored = localStorage.getItem("invoice");
        setInvoice(stored ? JSON.parse(stored) : []);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // زر "تم الدفع" لمسح الفاتورة وإغلاق النافذة
  const handleClearInvoice = () => {
    setInvoice([]);
    localStorage.setItem("invoice", JSON.stringify([]));
    setInvoiceDialogOpen(false);
  };

  // قائمة الأغاني (أسماء حقيقية من public/audio)
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
  ];
  const [currentSong, setCurrentSong] = useState(songs[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  // تشغيل أغنية عشوائية
  const playRandomSong = () => {
    let nextSong = currentSong;
    while (songs.length > 1 && nextSong.src === currentSong.src) {
      nextSong = songs[Math.floor(Math.random() * songs.length)];
    }
    setCurrentSong(nextSong);
    setTimeout(() => {
      const audio = document.getElementById('cafe-music') as HTMLAudioElement;
      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }
    }, 100);
  };

  // تشغيل/إيقاف الموسيقى
  const toggleMusic = () => {
    const audio = document.getElementById('cafe-music') as HTMLAudioElement;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.currentTime = 0;
      audio.play();
      setIsPlaying(true);
    }
  };

  // عند تغيير الأغنية، إذا كانت تعمل، شغل الجديدة تلقائياً
  useEffect(() => {
    const audio = document.getElementById('cafe-music') as HTMLAudioElement;
    if (audio && isPlaying) {
      audio.currentTime = 0;
      audio.play();
    }
  }, [currentSong]);

  // عند انتهاء الأغنية، غير حالة isPlaying
  useEffect(() => {
    const audio = document.getElementById('cafe-music') as HTMLAudioElement;
    if (!audio) return;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentSong]);

  // Scroll to top on location.pathname change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // --- Golden Impression Animation State ---
  const [showWelcome, setShowWelcome] = useState(() => {
    // تظهر فقط إذا لم يتم عرضها من قبل
    return !localStorage.getItem('welcomeShown');
  });
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
        localStorage.setItem('welcomeShown', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);
  const userName = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress || "ضيف";

  return (
    <div
      className="min-h-screen  bg-gradient-to-br from-[#fff8f0] via-[#f9f6ff] to-[#e8eaf6] dark:from-[#23243a] dark:via-[#181a20] dark:to-[#23243a] relative pb-32"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      onClick={() => invoiceDialogOpen && setInvoiceDialogOpen(false)}
      style={{ cursor: invoiceDialogOpen ? 'pointer' : undefined }}
    >
      {/* Golden Welcome Animation */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            key="golden-welcome"
            initial={{ opacity: 0, scale: 0.7, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'drop-shadow(0 0 40px #FFD700cc)' }}
            exit={{ opacity: 0, scale: 0.7, y: -60 }}
            transition={{ duration: 0.9, type: 'spring', bounce: 0.32 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-transparent pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -40 }}
              transition={{ duration: 0.7, type: 'spring', bounce: 0.3, delay: 0.1 }}
              className="bg-white/90 dark:bg-[#23243ad9] rounded-3xl shadow-2xl border-2 border-yellow-200 px-8 py-10 sm:px-14 sm:py-12 flex flex-col items-center max-w-[95vw] w-full sm:w-[420px] pointer-events-auto"
            >
              {/* Golden steam animation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: -30 }}
                transition={{ duration: 1.2, delay: 0.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                className="absolute left-1/2 -translate-x-1/2 -top-8"
              >
                <svg width="40" height="60" viewBox="0 0 40 60" fill="none">
                  <path d="M20 50 Q22 40 18 30 Q16 25 20 20" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" fill="none"/>
                </svg>
              </motion.div>
              <span className="inline-block text-[70px] sm:text-[90px] animate-bounce-slow drop-shadow-2xl select-none mb-2">☕</span>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7, type: 'spring', bounce: 0.3 }}
                className="text-2xl sm:text-3xl font-extrabold text-kian-burgundy dark:text-gold text-center mb-2 flex items-center gap-2"
              >
                <motion.span
                  initial={{ x: -30, opacity: 0, rotate: -10 }}
                  animate={{ x: 0, opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.7, duration: 0.5, type: 'spring', bounce: 0.4 }}
                  className="inline-block text-3xl sm:text-4xl"
                  role="img"
                  aria-label="wave"
                >👋</motion.span>
                <span className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-200 bg-clip-text text-transparent drop-shadow-lg dark:text-yellow-200 dark:bg-none dark:bg-none dark:drop-shadow-lg" style={{ WebkitTextStroke: '0.5px #a67c00', textShadow: '0 2px 8px #fffbe7, 0 1px 0 #a67c00' }}>
                  {language === 'ar'
                    ? `أهلاً بيك يا ${userName} 👑`
                    : `Welcome, ${userName} 👑`}
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.7, type: 'spring', bounce: 0.25 }}
                className="text-base sm:text-lg font-bold mt-2 drop-shadow text-center text-yellow-800 dark:text-yellow-200"
                style={{ textShadow: '0 2px 8px #fffbe7, 0 1px 0 #a67c00' }}
              >
                {language === 'ar'
                  ? 'نتمنى لك تجربة ذهبية في مثال كافيه'
                  : 'Wishing you a golden experience at Kayan Cafe!'}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <UserNavbar cartCount={0} />
      
      <div className="max-w-lg w-full  mx-auto px-2 sm:px-4 pt-4 sm:pt-6 space-y-5 sm:space-y-6">
        {/* Section 1: Start Order */}
        <motion.div
          className="w-full"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <Card className="w-full mt-[80px] flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl shadow-xl bg-gradient-to-r from-gold/90 to-yellow-200 cursor-pointer hover:scale-[1.03] transition-transform"
            onClick={() => navigate(`/Menu?table=${table}`)}
          >
            <span className="text-2xl sm:text-3xl">🍽️</span>
            <div className="flex-1 min-w-0">
              <div className="text-lg sm:text-xl font-extrabold text-kian-burgundy truncate">
                {language === 'ar' ? 'ابدأ تصفح المنيو' : 'Start Browsing the Menu'}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 truncate">
                {language === 'ar' ? 'اطلب أكلك أو مشروبك المفضل بسهولة' : 'Order your favorite food or drink easily'}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section 2: Previous Orders */}
        {user && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="mb-2 font-bold text-base sm:text-lg flex items-center gap-2">
              <Coffee className="w-5 h-5 text-gold" />
              {language === 'ar' ? 'الطلبات السابقة' : 'Previous Orders'}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gold/30 scrollbar-track-transparent">
              {recentOrders.length === 0 && (
                <div className="text-gray-400 text-sm py-4 px-2">
                  {language === 'ar' ? 'لا يوجد طلبات سابقة' : 'No previous orders'}
                </div>
              )}
              {recentOrders.map((order, idx) => (
                <Card key={order.id} className="min-w-[140px] max-w-[160px] flex flex-col items-center p-3 rounded-xl shadow-md bg-white/80 dark:bg-kian-charcoal/80">
                  <span className="text-2xl mb-1">🧾</span>
                  <div className="font-bold text-kian-burgundy dark:text-gold text-center mb-1">{order.request}</div>
                  <div className="text-xs text-gray-500 text-center">{order.created_at?.slice(0, 10)}</div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
  {/* Section: Drink Recommendation System */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={6}
        >
          <DrinkRecomaindationSystem />
        </motion.div>
        {/* Section 3: Music Offer */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <Card className="w-full flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl shadow-lg bg-gradient-to-r from-[#f9f6ff] to-[#fff8f0] dark:from-[#23243a] dark:to-[#181a20]">
            <Music className="w-10 h-10 text-gold mb-2" />
            <div className="font-bold text-base sm:text-lg mb-1 text-center">
              {language === 'ar' ? 'هل تود سماع الموسيقى اثناء انتظار طلبك ؟' : 'Would you like to listen to music while waiting for your order?'}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-center items-center">
              <div className="text-xs text-gray-500 mb-1 sm:mb-0">
                {language === 'ar' ? 'الأغنية الحالية:' : 'Now Playing:'} <span className="font-bold text-kian-burgundy dark:text-gold">{currentSong.name}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-full px-6 py-2 flex items-center gap-2 text-gold border-gold hover:bg-gold/10"
                  onClick={toggleMusic}
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                  ) : (
                    <Music className="w-5 h-5" />
                  )}
                  {isPlaying
                    ? (language === 'ar' ? 'إيقاف الموسيقى' : 'Pause Music')
                    : (language === 'ar' ? 'تشغيل الموسيقى' : 'Play Music')}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full px-4 py-2 flex items-center gap-2 text-gold border-gold hover:bg-gold/10"
                  onClick={() => {
                    playRandomSong();
                    setIsPlaying(true);
                  }}
                  aria-label={language === 'ar' ? 'تغيير الأغنية' : 'Change Song'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16M4 4l16 16" /></svg>
                  {language === 'ar' ? 'تغيير الأغنية' : 'Change Song'}
                </Button>
              </div>
            </div>
            {/* Hidden audio element for music playback */}
            <audio id="cafe-music" src={currentSong.src} preload="auto" style={{ display: 'none' }} />
          </Card>
        </motion.div>

        {/* Section 4: Today's Offers Carousel (Swiper) */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <div className="mb-2 font-bold text-base sm:text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-gold" />
            {language === 'ar' ? 'عروض النهاردة' : "Today's Offers"}
          </div>
          <Swiper
            key={language} // force re-mount on language change
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            modules={[Autoplay, Pagination]}
            spaceBetween={16}
            slidesPerView={2}
            loop={true}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            className="w-full py-2"
          >
            {slides.map((slide, idx) => (
              <SwiperSlide key={idx}>
                <Card className="flex flex-col items-center p-6 rounded-2xl shadow-xl bg-gradient-to-br from-yellow-50 to-gold/20 border-2 border-gold/10 mx-1">
                  <span className="text-4xl mb-3 animate-bounce">{slide.emoji}</span>
                  <div className="font-bold text-lg sm:text-xl text-kian-burgundy dark:text-gold text-center mb-2">
                    {slide.title[language]}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 text-center">
                    {slide.desc[language]}
                  </div>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>

        {/* Section 5: Get Wi-Fi */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          <Card className="w-full flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl shadow-lg bg-gradient-to-r from-[#e0f7fa] to-[#fffde4] dark:from-[#23243a] dark:to-[#181a20] border-2 border-gold/10">
            <Wifi className="w-10 h-10 text-gold mb-2" />
            <div className="font-bold text-base sm:text-lg mb-1 text-center">
              {language === 'ar' ? 'احصل على واي فاي مجاني' : 'Get Free Wi-Fi'}
            </div>
            <Button
              variant="outline"
              className="rounded-full px-6 py-2 flex items-center gap-2 text-gold border-gold hover:bg-gold/10 w-full sm:w-auto justify-center"
              onClick={() => {
                navigator.clipboard.writeText('CafeWifi2025');
                toast({
                  title: language === 'ar' ? 'تم نسخ كلمة السر!' : 'Password copied!',
                  description: language === 'ar' ? 'تم نسخ كلمة سر الواي فاي بنجاح.' : 'Wi-Fi password copied successfully.',
                  variant: 'default',
                });
              }}
            >
              <Wifi className="w-5 h-5" />
              {language === 'ar' ? 'نسخ كلمة السر' : 'Copy Password'}
            </Button>
           
          </Card>
        </motion.div>

        {/* Section 6: Suggestions */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={5}
        >
          <div className="mb-2 font-bold text-base sm:text-lg flex items-center gap-2">
            <span className="text-xl">💡</span>
            {language === 'ar' ? 'مقترحات لك' : 'Suggestions for you'}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gold/30 scrollbar-track-transparent">
            {suggestions.map((s, idx) => (
              <Card key={idx} className="min-w-[140px] max-w-[180px] flex flex-col items-center p-3 rounded-xl shadow-md bg-white/80 dark:bg-kian-charcoal/80">
                <span className="text-2xl mb-1">{s.emoji}</span>
                <div className="font-bold text-kian-burgundy dark:text-gold text-center mb-1">{s.title[language]}</div>
                <div className="text-xs text-gray-500 text-center">{s.desc[language]}</div>
              </Card>
            ))}
          </div>
        </motion.div>

      
      </div>

      {/* Sticky Action Buttons */}
      <div className="fixed bottom-0 left-0 w-full z-20 flex flex-col items-center pb-3 sm:pb-4 pointer-events-none">
        <div className="flex items-center justify-center gap-2 sm:gap-3 w-full max-w-lg px-2 sm:px-4 pointer-events-auto">
          <Button
            className="w-[45%] h-14 sm:h-14 rounded-2xl bg-gold text-kian-charcoal font-bold text-base sm:text-lg shadow-lg hover:bg-[#dfa804]"
            onClick={() => navigate(`/call-waiter?table=${table}`)}
          >
            <Bell className="w-5 h-5 mr-1 sm:mr-2" />
            {language === 'ar' ? 'نداء سريع للنادل' : 'Quick Call Waiter'}
          </Button>
          <Button
            className="w-[45%] h-14 text-wrap sm:h-14 rounded-2xl bg-white/90 dark:bg-kian-charcoal/90 text-kian-burgundy dark:text-gold font-bold text-base sm:text-lg shadow-lg border border-gold hover:bg-gold/10"
            onClick={() => navigate(`/Menu?table=${table}`)}
          >
            <Receipt className="w-5 h-5 mr-1 sm:mr-2" />
            {language === 'ar' ? 'طلب من المنيو' : 'Request from Menu'}
          </Button>
        </div>

        {/* Floating Invoice Button (Unified Design) */}
        <div className="z-[101] pointer-events-auto">
          <InvoiceFloatingButton onClick={() => setInvoiceDialogOpen(true)} />
        </div>
      </div>

      {/* Invoice Dialog (Unified) */}
      <AnimatePresence>
        {invoiceDialogOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInvoiceDialogOpen(false)} // Close dialog when clicking overlay
          >
            <Card className="w-full max-w-md p-6 rounded-2xl shadow-xl bg-white dark:bg-kian-charcoal" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-bold text-kian-burgundy">
                  {language === 'ar' ? 'فاتورة المشتريات' : 'Purchase Invoice'}
                </div>
                <Button
                  variant="ghost"
                  className="h-10 w-10 p-0 rounded-full"
                  onClick={() => setInvoiceDialogOpen(false)}
                >
                  <span className="text-2xl">×</span>
                </Button>
              </div>
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
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserHome;
