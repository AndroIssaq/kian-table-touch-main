
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeLanguageToggle from "@/components/ThemeLanguageToggle";
import { supabase } from "@/integrations/supabase/client";
import { registerLoyaltyVisit } from "@/integrations/supabase/loyalty";
import DOMPurify from "dompurify";

const CallWaiter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [request, setRequest] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [loyaltyReward, setLoyaltyReward] = useState<string | undefined>();
  const [phoneNumberDisabled, setPhoneNumberDisabled] = useState(false);
  const [savedPhoneNumber, setSavedPhoneNumber] = useState<string | null>(null);
  const { t, language } = useLanguage();
  
  // التحقق من صحة رقم الهاتف المصري
  const validateEgyptianPhone = (phone: string) => {
    if (!phone) return true;
    const egyptianPhoneRegex = /^01[0-9]{9}$/;
    return egyptianPhoneRegex.test(phone);
  };
  
  // التعامل مع تغيير رقم الهاتف
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    if (value && !validateEgyptianPhone(value)) {
      setPhoneError(t("invalidEgyptianPhone") || "رقم هاتف مصري غير صالح");
    } else {
      setPhoneError("");
    }
  };
  
  // التحقق من رقم الهاتف المحفوظ في localStorage
  useEffect(() => {
    const savedPhone = localStorage.getItem('customerPhoneNumber');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      setSavedPhoneNumber(savedPhone);
      setPhoneNumberDisabled(true);
    }
  }, []);
  
  // استخراج رقم الطاولة من عنوان URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const table = params.get("table");
    
    if (!table) {
      toast({
        title: t("error"),
        description: t("noTable"),
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    setTableNumber(parseInt(table, 10));
  }, [location.search, navigate, t]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tableNumber === null) {
      toast({
        title: t("error"),
        description: t("noTable"),
        variant: "destructive",
      });
      return;
    }
    
    if (phoneNumber && !validateEgyptianPhone(phoneNumber)) {
      toast({
        title: t("error"),
        description: t("invalidEgyptianPhone") || "رقم هاتف مصري غير صالح",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const sanitizedRequest = DOMPurify.sanitize(request);
      
      const requestData = { 
        table_number: tableNumber, 
        request: sanitizedRequest 
      };
      
      if (phoneNumber) {
        requestData.phone_number = phoneNumber;
      }
      
      const { error: requestError } = await supabase
        .from("waiter_requests")
        .insert([requestData]);
      
      if (requestError) {
        throw new Error(requestError.message);
      }
      
      try {
        const hasPhoneNumber = phoneNumber && phoneNumber.trim() !== "";
        const result = await registerLoyaltyVisit(phoneNumber, hasPhoneNumber);
        setLoyaltyPoints(result.points);
        setLoyaltyReward(result.reward);
        
        if (hasPhoneNumber && (result.isNewUser || !savedPhoneNumber)) {
          localStorage.setItem('customerPhoneNumber', phoneNumber);
          setSavedPhoneNumber(phoneNumber);
          setPhoneNumberDisabled(true);
        }
        
        let loyaltyMessage = "";
        
        if (result.alreadyVisitedToday) {
          loyaltyMessage = `"${t("loyaltyPoints") || "نقاط الولاء"}: ${result.points}. لقد حصلت على نقاط اليوم بالفعل، عد غدًا للصول على المزيد!"`; 
        } else if (result.reward) {
          const rewardMessage = result.reward === "free_drink" 
            ? "مبروك! لقد وصلت إلى 10 نقاط وحصلت على مشروب مجاني"
            : "مبروك! لقد وصلت إلى 20 نقطة وحصلت على خصم 20%";
          
          loyaltyMessage = `${rewardMessage} 🎉 (${result.points} نقاط)`;
        } else if (hasPhoneNumber) {
          const pointsEarned = 1;
          
          let pointsToNextReward = 0;
          let rewardType = "";
          
          if (result.points < 10) {
            pointsToNextReward = 10 - result.points;
            rewardType = "مشروب مجاني";
          } else if (result.points < 20) {
            pointsToNextReward = 20 - result.points;
            rewardType = "خصم 20%";
          }
          
          loyaltyMessage = `"${t("loyaltyPoints") || "نقاط الولاء"}: ${result.points} :  ( ${pointsToNextReward} نقاط متبقية للحصول على ${rewardType}." ) `; 
        } else {
          loyaltyMessage = "أدخل رقم هاتفك في المرة القادمة للحصول على نقاط الولاء!";
        }
        
        toast({
          title: t("waiterCalled"),
          description: `${t("staffComing")} ${tableNumber}. ${loyaltyMessage}`,
        });
      } catch (loyaltyError) {
        toast({
          title: t("waiterCalled"),
          description: `${t("staffComing")} ${tableNumber}.`,
        });
      }
      
      navigate("/");
    } catch (error) {
      toast({
        title: t("error"),
        description: t("errorSendingRequest"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <PageTransition>
      <div className="cafe-container">
        <div className="mb-6">
          <ThemeLanguageToggle />
        </div>
        
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate("/")}
        >
          <ArrowLeft className={`${language === "ar" ? "ml-2" : "mr-2"} h-4 w-4`} /> {t("back")}
        </Button>
        
        <motion.h1 
          className="text-2xl md:text-3xl font-bold mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t("callWaiterTo")} {tableNumber}
        </motion.h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="text-sm font-medium flex items-center">
              <Award className="h-4 w-4 mr-2 text-kian-gold" />
              {t("phoneNumber") || "رقم الهاتف"} 
            </label>
            <Input
              id="phoneNumber"
              placeholder={t("egyptianPhonePlaceholder") || "أدخل رقم هاتفك المصري"}
              value={phoneNumber}
              onChange={handlePhoneChange}
              className={phoneError ? "border-red-500" : " text-start"}
              type="tel"
              dir={language === "ar" ? "rtl" : "ltr"}
              disabled={phoneNumberDisabled}
            />
            {phoneNumberDisabled && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-kian-gold flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  {"تم حفظ رقم هاتفك للحصول على نقاط الولاء"}
                </span>
              </p>
            )}
            {phoneError && (
              <p className="text-sm text-red-500">{phoneError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("loyaltyPointsInfo") || "أدخل رقم هاتفك للحصول على نقاط ولاء"}
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="request" className="text-sm font-medium">
              {t("whatYouNeed")}
            </label>
            <Textarea
              id="request"
              placeholder={t("placeholder")}
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              className="min-h-32"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gold hover:bg-[#dfa804] dark:bg-kian-gold dark:hover:bg-kian-gold/90 dark:text-kian-charcoal h-14"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("calling") : t("callWaiterNow")}
          </Button>
        </form>
      </div>
      <Toaster />
    </PageTransition>
  );
};

export default CallWaiter;
