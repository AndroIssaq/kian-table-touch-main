
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TableGrid from "@/components/TableGrid";
import ActionButtons from "@/components/ActionButtons";
import PageTransition from "@/components/PageTransition";
import ThemeLanguageToggle from "@/components/ThemeLanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Award, PartyPopper } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getLoyaltyPoints } from "@/integrations/supabase/loyalty";
import Confetti from "react-confetti";

const ChooseTable = () => {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [loyaltyResult, setLoyaltyResult] = useState<{points: number, reward?: string, found: boolean} | null>(null);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  const { t, language } = useLanguage();
  
  // Update window size for confetti effect
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
  
  // Auto-hide celebration after 8 seconds
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
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    // Reset results when input changes
    setLoyaltyResult(null);
  };
  
  const handleSearchLoyalty = async () => {
    if (!phoneNumber || phoneNumber.trim() === "") {
      toast({
        title: t("error"),
        description: t("invalidEgyptianPhone"),
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSearching(true);
      const result = await getLoyaltyPoints(phoneNumber);
      setLoyaltyResult(result);
      
      if (!result.found) {
        toast({
          title: t("noResults") || "No Results",
          description: t("noLoyaltyFound") || "No loyalty points found for this phone number",
          variant: "destructive",
        });
      } else {
        // Show celebration for all users who have loyalty points
        setShowCelebration(true);
      }
    } catch (error) {
      console.error("Error searching loyalty points:", error);
      toast({
        title: t("error"),
        description: t("failedToFetchLoyaltyInfo"),
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Get personalized message based on loyalty points
  const getCelebrationMessage = () => {
    if (!loyaltyResult) return "";
    
    if (loyaltyResult.points === 10) {
      return t("tenPointsMessage") || "Thank you for coming to the café 10 times. We are all grateful to you here and happy that you liked the place and are waiting for you next time.";
    } else if (loyaltyResult.points === 20) {
      return t("twentyPointsMessage") || "Wow! You've visited us 20 times! We're honored by your loyalty and want to thank you with a special discount. We look forward to seeing you again soon!";
    } else if (loyaltyResult.points < 10) {
      return `${t("almostThereMessage") || "You're almost there!"} ${10 - loyaltyResult.points} ${t("pointsAwayFromReward") || "more visits until you get a free drink!"}`; 
    } else {
      return `${t("keepGoingMessage") || "Keep going!"} ${20 - loyaltyResult.points} ${t("pointsAwayFromDiscount") || "more visits until you get a 20% discount!"}`; 
    }
  };
  
  return (
    <PageTransition>
      {/* Confetti celebration effect */}
      {showCelebration && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
        />
      )}
      
      {/* Celebration modal */}
      <AnimatePresence>
        {showCelebration && loyaltyResult && loyaltyResult.found && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              className="bg-white dark:bg-kian-charcoal max-w-md w-full rounded-xl p-6 shadow-xl relative overflow-hidden"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-kian-burgundy via-gold to-kian-burgundy" />
              
              <div className="flex justify-center mb-4">
                <div className="bg-gold/20 p-3 rounded-full">
                  <PartyPopper className="h-10 w-10 text-gold" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-center mb-4 text-kian-burgundy dark:text-gold">
                {t("celebrationTitle")}
              </h2>
              
              <p className="text-center mb-6 text-kian-charcoal/80 dark:text-kian-sand/80">
                {getCelebrationMessage()}
              </p>
              
              <div className="flex justify-center">
                <Button
                  className="bg-gold hover:bg-gold/90 text-black px-8"
                  onClick={() => setShowCelebration(false)}
                >
                  {t("thanks") || "Thank you!"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="cafe-container">
        <div className="mb-6">
          <ThemeLanguageToggle />
        </div>

        <header>
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-center mb-2 text-gradient"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t("welcome")}
          </motion.h1>
          <motion.div
          className="w-full max-w-md mx-auto mt-8 bg-white dark:bg-kian-charcoal/20 rounded-xl shadow-md overflow-hidden p-6 border border-kian-sand/20 dark:border-kian-burgundy/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center justify-center mb-4">
            <Award className="h-6 w-6 text-kian-burgundy dark:text-kian-sand mr-2" />
            <h2 className="text-xl font-semibold text-center text-kian-charcoal dark:text-kian-sand">
              {t("checkLoyaltyPoints") || "Check Your Loyalty Points"}
            </h2>
          </div>
          
          <div className="flex flex-col space-y-4">
            <div className="flex">
              <div className="relative flex-grow">
                <Input
                  type="tel"
                  placeholder={t("enterPhoneNumber") || "Enter your phone number"}
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="pr-10 bg-white dark:bg-kian-charcoal/30"
                  dir="ltr"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Search className="h-4 w-4 text-kian-charcoal/50 dark:text-kian-sand/50" />
                </div>
              </div>
              <Button
                onClick={handleSearchLoyalty}
                disabled={isSearching || !phoneNumber}
                className="ml-2 mx-[10px] bg-gold hover:bg-gold/90 text-black"
              >
                {isSearching ? (t("searching") || "Searching...") : (t("search") || "Search")}
              </Button>
            </div>
            
            {loyaltyResult && loyaltyResult.found && (
              <motion.div
                className="mt-4 p-4 bg-kian-sand/10 dark:bg-kian-burgundy/10 rounded-lg border border-kian-sand/20 dark:border-kian-burgundy/20"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-kian-charcoal/70 dark:text-kian-sand/70">{t("points") || "Points"}:</span>
                  <span className="text-xl font-bold text-kian-burgundy dark:text-kian-sand">{loyaltyResult.points}</span>
                </div>
                
                {loyaltyResult.reward && (
                  <div className="flex items-center justify-between">
                    <span className="text-kian-charcoal/70 dark:text-kian-sand/70">{t("gift") || "Gift"}:</span>
                    <span className="font-medium text-kian-burgundy dark:text-kian-sand">
                      {loyaltyResult.reward === "free_drink" ? (t("freeDrink") || "Free Drink") : 
                       loyaltyResult.reward === "special_discount" ? (t("discount") || "20% Discount") : "-"}
                    </span>
                  </div>
                )}
                
                {!loyaltyResult.reward && loyaltyResult.points > 0 && (
                  <div className="mt-2 text-sm text-kian-charcoal/60 dark:text-kian-sand/60">
                    {loyaltyResult.points < 10 ? 
                      `${10 - loyaltyResult.points} ${t("pointsToFreeDrink") || "more points for a free drink"}` : 
                      `${20 - loyaltyResult.points} ${t("pointsToDiscount") || "more points for 20% discount"}`}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
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
          <ActionButtons selectedTable={selectedTable} />
        </div>
        
       
      </div>
    </PageTransition>
  );
};

export default ChooseTable;
