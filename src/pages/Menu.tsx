
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeLanguageToggle from "@/components/ThemeLanguageToggle";

const Menu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const { t, language } = useLanguage();
  
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
        
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {t("restaurantMenu")}
        </h1>
        <p className="text-kian-charcoal/80 dark:text-kian-sand/80 mb-6">
          {t("table")} {tableNumber}
        </p>
        
        <div className="text-center py-12 px-4 border-2 border-dashed border-kian-sand dark:border-kian-burgundy rounded-xl">
          <p className="text-lg text-kian-charcoal/70 dark:text-kian-sand/70">
            {t("menuContent")}
          </p>
          <p className="mt-2 text-sm text-kian-charcoal/50 dark:text-kian-sand/50">
            {t("menuDescription")}
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default Menu;
