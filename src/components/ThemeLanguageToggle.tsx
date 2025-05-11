
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Moon, Sun, Globe } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const ThemeLanguageToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  
  return (
    <motion.div
      className="flex items-center justify-between px-4 py-3 rounded-xl bg-background/80 backdrop-blur-sm border border-border"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-2">
        <Switch
          checked={theme === "dark"}
          onCheckedChange={toggleTheme}
          id="theme-toggle"
        />
        <label htmlFor="theme-toggle" className="text-sm flex items-center gap-1.5">
          {theme === "dark" ? (
            <>
              <Moon size={16} />
              <span>{t("darkMode")}</span>
            </>
          ) : (
            <>
              <Sun size={16} />
              <span>{t("lightMode")}</span>
            </>
          )}
        </label>
      </div>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={toggleLanguage}
        className="flex items-center gap-1 text-sm"
      >
        <Globe size={16} />
        <span>
          {language === "en" ? t("arabic") : t("english")}
        </span>
      </Button>
    </motion.div>
  );
};

export default ThemeLanguageToggle;
