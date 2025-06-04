import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, Menu } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface ActionButtonsProps {
  selectedTable: number | null;
  tableNumber?: string | number | null;
}

const ActionButtons = ({ selectedTable, tableNumber }: ActionButtonsProps) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const table = tableNumber || selectedTable;
  
  const handleAction = (action: 'user-home' | 'menu') => {
    if (!table) {
      toast({
        title: t("tableRequired"),
        description: t("pleaseSelect"),
        variant: "destructive",
      });
      return;
    }
    navigate(`/${action}?table=${table}`);
  };
  
  return (

    <motion.div 
      className="flex items-center justify-center w-full "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="fixed bottom-[5%] xl:w-[50%] lg:w-[50%] md:w-[50%] sm:w-[90%] w-[90%] flex-col items-center justify-center space-y-4 mt-6">
        <Button 
          className="action-button w-full bg-black hover:bg-black/90 dark:bg-gold dark:hover:bg-gold/90 dark:text-black h-16 text-lg text-white"
          onClick={() => handleAction('user-home')}
        >
          <Home className={`${language === "ar" ? "ml-2" : "mr-2"} h-5 w-5`} />
          {t("userHome")}
        </Button>
        
        <Button 
          className="action-button w-full bg-gold hover:bg-gold/90 text-black dark:bg-black dark:hover:bg-black/90 dark:text-gold h-16 text-lg"
          onClick={() => handleAction('menu')}
        >
          <Menu className={`${language === "ar" ? "ml-2" : "mr-2"} h-5 w-5`} />
          {t("viewMenu")}
        </Button>
      </div>
     
    </motion.div>
  );
};

export default ActionButtons;
