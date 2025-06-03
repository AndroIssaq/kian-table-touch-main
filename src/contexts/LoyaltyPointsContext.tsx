import React, { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";

interface LoyaltyPointsContextType {
  points: number | null;
  setPoints: (pts: number | null) => void;
  refreshPoints: () => Promise<void>;
}

const LoyaltyPointsContext = createContext<LoyaltyPointsContextType | undefined>(undefined);

export const LoyaltyPointsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const [points, setPoints] = useState<number | null>(null);

  const refreshPoints = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await (supabase as any)
      .from('loyalty_visits')
      .select('points')
      .eq('user_id', user.id)
      .single();
    if (!error && data) setPoints(data.points);
  }, [user?.id]);

  React.useEffect(() => {
    refreshPoints();
  }, [refreshPoints]);

  return (
    <LoyaltyPointsContext.Provider value={{ points, setPoints, refreshPoints }}>
      {children}
    </LoyaltyPointsContext.Provider>
  );
};

export const useLoyaltyPoints = () => {
  const ctx = useContext(LoyaltyPointsContext);
  if (!ctx) throw new Error("useLoyaltyPoints must be used within LoyaltyPointsProvider");
  return ctx;
};
