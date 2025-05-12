import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeLanguageToggle from "@/components/ThemeLanguageToggle";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface WaiterRequest {
  id: string;
  table_number: number;
  request: string | null;
  status: string;
  created_at: string;
  phone_number: string | null;
  deleted: boolean;
}

interface LoyaltyInfo {
  phone_number: string;
  points: number;
  status: string | null;
  got_the_gift: boolean | null;
  point_status: 'approved' | 'pending' | 'rejected' | null;
}

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState<WaiterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loyaltyInfo, setLoyaltyInfo] = useState<Record<string, LoyaltyInfo>>({});
  const { logout } = useAdminAuth();

  // Fetch waiter requests and set up real-time subscription
  useEffect(() => {
    // Initial fetch of waiter requests
    const fetchRequests = async () => {
      try {
        const { data, error } = await supabase
          .from("waiter_requests")
          .select("*")
          .eq("deleted", false)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          setRequests(data);
          
          // Fetch loyalty information for phone numbers
          const phoneNumbers = data
            .filter(req => req.phone_number)
            .map(req => req.phone_number as string);
          
          if (phoneNumbers.length > 0) {
            fetchLoyaltyInfo(phoneNumbers);
          }
        }
      } catch (error) {
        console.error("Error fetching waiter requests:", error);
        toast({
          title: t("error"),
          description: "Failed to load waiter requests",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // Set up real-time subscription
    const subscription = supabase
      .channel("waiter_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiter_requests",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // بدلاً من إضافة الطلب فقط، قم بتحديث كل الطلبات
            fetchRequests();
            // يمكن أيضاً عرض toast إذا أردت
            toast({
              title: "New request",
              description: `New request from Table ${payload.new.table_number}`,
            });
          } else if (payload.eventType === "UPDATE") {
            fetchRequests();
          } else if (payload.eventType === "DELETE") {
            fetchRequests();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [t]);

// تعديل في وظيفة fetchLoyaltyInfo
const fetchLoyaltyInfo = async (phoneNumbers: string[]) => {
  try {
    // تخطي إذا لم تكن هناك أرقام هواتف للجلب
    if (!phoneNumbers.length) return;
    
    console.log("Fetching loyalty info for:", phoneNumbers); // إضافة سجل للتصحيح
    
    const { data, error } = await supabase
      .from("loyalty_visits")
      .select("id, phone_number, points, status, got_the_gift, point_status")
      .in("phone_number", phoneNumbers);

    if (error) {
      throw error;
    }

    // إنشاء أو تحديث بيانات الولاء لكل رقم هاتف
    const loyaltyData: Record<string, LoyaltyInfo> = {};
    const phonesToCreate: string[] = [...phoneNumbers];
    
    // معالجة البيانات الموجودة من قاعدة البيانات
    if (data && data.length > 0) {
      data.forEach((item) => {
        // إزالة من قائمة الهواتف المراد إنشاؤها
        const index = phonesToCreate.indexOf(item.phone_number);
        if (index > -1) {
          phonesToCreate.splice(index, 1);
        }
        
        // التأكد من أن حالة النقطة معينة على 'pending' إذا كانت null
        loyaltyData[item.phone_number] = {
          ...item,
          point_status: item.point_status || 'pending'
        };
      });
    }
    
    // إنشاء إدخالات لأرقام الهواتف التي لا توجد في قاعدة البيانات بعد
    if (phonesToCreate.length > 0) {
      console.log("Creating new loyalty entries for:", phonesToCreate); // إضافة سجل للتصحيح
      
      // إضافة تأخير قصير قبل إنشاء سجلات جديدة
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // التحقق مرة أخرى من وجود السجلات (لتجنب الإدخالات المكررة)
      const { data: doubleCheckData, error: doubleCheckError } = await supabase
        .from("loyalty_visits")
        .select("phone_number")
        .in("phone_number", phonesToCreate);
        
      if (!doubleCheckError && doubleCheckData && doubleCheckData.length > 0) {
        // إزالة أرقام الهواتف التي تم إنشاؤها بالفعل
        doubleCheckData.forEach(item => {
          const index = phonesToCreate.indexOf(item.phone_number);
          if (index > -1) {
            phonesToCreate.splice(index, 1);
          }
        });
      }
      
      // إنشاء إدخالات في دفعة واحدة (فقط للأرقام التي لا تزال بحاجة إلى إنشاء)
      if (phonesToCreate.length > 0) {
        const newEntries = phonesToCreate.map(phone => ({
          phone_number: phone,
          points: 0,
          status: null,
          got_the_gift: false,
          point_status: 'pending'
        }));
        
        // إدراج جميع الإدخالات الجديدة دفعة واحدة
        const { data: newData, error: insertError } = await supabase
          .from("loyalty_visits")
          .insert(newEntries)
          .select("id, phone_number, points, status, got_the_gift, point_status");
          
        if (!insertError && newData) {
          // إضافة إدخالات جديدة إلى loyaltyData
          newData.forEach(item => {
            loyaltyData[item.phone_number] = item;
          });
        } else if (insertError) {
          console.error("Error inserting new loyalty entries:", insertError);
        }
      }
    }
    
    setLoyaltyInfo((prev) => ({ ...prev, ...loyaltyData }));
  } catch (error) {
    console.error("Error fetching loyalty information:", error);
  }
};
  // Create a new loyalty entry for a phone number
  const createLoyaltyEntry = async (phoneNumber: string) => {
    try {
      const { data, error } = await supabase
        .from("loyalty_visits")
        .insert({
          phone_number: phoneNumber,
          points: 0,
          got_the_gift: false,
          point_status: 'pending'
        })
        .select("id");
        
      if (error) {
        console.error("Error creating loyalty entry:", error);
        return null;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error("Error creating loyalty entry:", error);
      return null;
    }
  };

  // Mark request as completed
  const markAsCompleted = async (id: string) => {
    try {
      const { error } = await supabase
        .from("waiter_requests")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: "completed" } : req
        )
      );

      toast({
        title: t("completed"),
        description: t("markedAsComplete"),
      });
    } catch (error) {
      console.error("Error marking request as completed:", error);
      toast({
        title: t("failedToMarkAsComplete"),
        description: t("failedToMarkAsComplete"),
        variant: "destructive",
      });
    }
  };

  // Mark request as pending
  const markAsPending = async (id: string) => {
    try {
      const { error } = await supabase
        .from("waiter_requests")
        .update({ status: "pending" })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: "pending" } : req
        )
      );

      toast({
        title: t("success"),
        description: t("markedAsPending"),
      });
    } catch (error) {
      console.error("Error marking request as pending:", error);
      toast({
        title: t("failedToMarkAsPending"),
        description: t("failedToMarkAsPending"),
        variant: "destructive",
      });
    }
  };

  // Delete request
  const deleteRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from("waiter_requests")
        .update({ deleted: true })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setRequests((prev) => prev.filter((req) => req.id !== id));

      toast({
        title: t("success"),
        description: t("deleted"),
      });
    } catch (error) {
      console.error("Error deleting request:", error);
      toast({
        title: t("failedToDeleteRequest"),
        description: t("failedToDeleteRequest"),
        variant: "destructive",
      });
    }
  };
  
  // Update point status
  const updatePointStatus = async (phoneNumber: string, status: 'approved' | 'pending' | 'rejected') => {
    try {
      // Get current loyalty info before updating
      const { data: currentDataArray, error: fetchError } = await supabase
        .from("loyalty_visits")
        .select("id, points, point_status")
        .eq("phone_number", phoneNumber);
      
      if (fetchError) {
        throw fetchError;
      }
      
      // If no records found, create one
      let recordsToUse = currentDataArray || [];
      if (recordsToUse.length === 0) {
        const newEntry = await createLoyaltyEntry(phoneNumber);
        if (!newEntry) {
          throw new Error("Failed to create loyalty entry");
        }
        
        // Use the newly created entry
        const { data: newData, error: newFetchError } = await supabase
          .from("loyalty_visits")
          .select("id, points, point_status")
          .eq("id", newEntry.id);
          
        if (newFetchError || !newData || newData.length === 0) {
          throw newFetchError || new Error("Failed to fetch newly created loyalty entry");
        }
        
        recordsToUse = newData;
      }
      
      // Use the first record as the current data
      const currentData = recordsToUse[0];
      const currentPoints = currentData.points || 0;
      const currentPointStatus = currentData.point_status || 'pending';
      
      // Prepare updates
      const updates: { point_status: string; points?: number } = { point_status: status };
      
      // Only award points if status is changed to approved and wasn't already approved
      if (status === 'approved' && currentPointStatus !== 'approved') {
        // Add 1 point to the customer's total
        updates.points = currentPoints + 1;
      } 
      // If changing from approved to rejected/pending, remove the point
      else if (status !== 'approved' && currentPointStatus === 'approved') {
        // Remove 1 point from the customer's total (but don't go below 0)
        updates.points = Math.max(0, currentPoints - 1);
      }
      
      // Update the database with new status and possibly new points
      const { error } = await supabase
        .from("loyalty_visits")
        .update(updates)
        .eq("id", currentData.id);

      if (error) {
        throw error;
      }
      
      // Clean up duplicate records if any exist
      if (recordsToUse.length > 1) {
        const idsToDelete = recordsToUse.slice(1).map(record => record.id);
        await supabase.from("loyalty_visits").delete().in("id", idsToDelete);
      }

      // Update the local state
      setLoyaltyInfo((prev) => {
        const currentInfo = prev[phoneNumber] || {
          phone_number: phoneNumber,
          points: 0,
          status: null,
          got_the_gift: false,
          point_status: 'pending'
        };
        
        return {
          ...prev,
          [phoneNumber]: {
            ...currentInfo,
            point_status: status,
            points: updates.points !== undefined ? updates.points : currentInfo.points
          }
        };
      });

      // أضف هذا السطر بعد تحديث الحالية المحلية
      fetchLoyaltyInfo([phoneNumber]);

      // Show appropriate toast message
      const messageMap = {
        'approved': t("pointApproved"),
        'rejected': t("pointRejected"),
        'pending': t("pointPending")
      };
      
      toast({
        title: t("success"),
        description: status === 'approved' && currentPointStatus !== 'approved' ? messageMap.approved : 
                     status !== 'approved' && currentPointStatus === 'approved' ? t("pointRemovedFromCustomer") : 
                     messageMap[status],
      });
    } catch (error) {
      console.error("Error updating point status:", error);
      toast({
        title: t("error"),
        description: "Failed to update point status",
        variant: "destructive",
      });
    }
  };

  // Toggle gift status
  const toggleGiftStatus = async (phoneNumber: string, currentStatus: boolean | null) => {
    try {
      const newStatus = !currentStatus;
      
      const { error } = await supabase
        .from("loyalty_visits")
        .update({ got_the_gift: newStatus })
        .eq("phone_number", phoneNumber);

      if (error) {
        throw error;
      }

      // Update the local state
      setLoyaltyInfo((prev) => ({
        ...prev,
        [phoneNumber]: {
          ...prev[phoneNumber],
          got_the_gift: newStatus
        }
      }));

      toast({
        title: t("success"),
        description: newStatus ? t("giftReceived") : t("giftNotReceived"),
      });
    } catch (error) {
      console.error("Error toggling gift status:", error);
      toast({
        title: t("error"),
        description: t("failedToUpdateGiftStatus") || "Failed to update gift status",
        variant: "destructive",
      });
    }
  };

  // Format date based on current language
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "h:mm a", {
      locale: language === "ar" ? ar : enUS,
    });
  };

  return (
    <PageTransition>
      <div className=" w-[90%]  mx-auto mt-[20px]">
        <div className="mb-6">
          <ThemeLanguageToggle />
        </div>

        <div className="flex flex-col items-center mb-8 relative">
          <div className=" flex items-center w-full justify-between">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center">
              {t("staffDashboard")}
            </h1>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                className="bg-gold hover:bg-gold/90 text-black dark:bg-black dark:hover:bg-black/90 dark:text-gold"
                onClick={() => navigate("/loyalty-management")}
              >
                توليد الكود اليومي
              </Button>
              
              <Button 
                variant="outline" 
                onClick={logout}
              >
                {t("logout")}
              </Button>
              
              <div className="relative">
                <Bell className="h-12 w-12 text-kian-charcoal dark:text-kian-sand" />
                {requests.filter(req => req.status === "pending").length > 0 && (
                  <span className="absolute -top-2    -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {requests.filter(req => req.status === "pending").length}
                  </span>
                )}
              </div>
            </div>
          </div>
         
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p>{t("loadingRequests")}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 px-4 text-[25px] border-2 border-dashed border-kian-sand dark:border-kian-burgundy rounded-xl">
            <Bell className="mx-auto h-16 w-16  text-kian-charcoal/30 dark:text-kian-sand/30 mb-4" />
            <p className="text-lg text-kian-charcoal/70 dark:text-kian-sand/70">
              {t("noRequests")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto ">
            <Table >
              <TableCaption>
                {requests.length} {t("activeRequests") || "Active Requests"}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[10%] text-start">{t("tableColumn")}</TableHead>
                  <TableHead className="w-[10%] text-start">{t("timeColumn")}</TableHead>
                  <TableHead className="w-[10%] text-start">{t("requestColumn")}</TableHead>
                  <TableHead className="w-[10%] text-start">{t("phoneNumber") || "Phone Number"}</TableHead>
                  <TableHead className="w-[10%] text-start">{t("statusColumn")}</TableHead>
                  <TableHead className="w-[10%] text-start">{t("points")}</TableHead>
                  <TableHead className="w-[10%] text-start">{t("pointStatus") || "Point Status"}</TableHead>
                  <TableHead className="w-[10%] text-start">{t("gift")}</TableHead>
                  <TableHead className="w-[10%] text-start">{t("giftStatus")}</TableHead>
                 
                  <TableHead className="w-[10%] text-center">{t("actionColumn")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="w-[10%] font-medium">
                      {request.table_number}
                    </TableCell>
                    <TableCell className="w-[10%]">{formatDate(request.created_at)}</TableCell>
                    <TableCell className="w-[10%]">
                      {request.request || t("noSpecificRequest")}
                    </TableCell>
                    <TableCell className="w-[10%] text-start">
                      {request.phone_number || "-"}
                    </TableCell>
                    <TableCell className="w-[10%] text-start">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          request.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                        }`}
                      >
                        {request.status === "completed"
                          ? t("completed")
                          : t("pending")}
                      </span>
                    </TableCell>
                    <TableCell className="w-[10%]">
                      {request.phone_number && loyaltyInfo[request.phone_number]
                        ? loyaltyInfo[request.phone_number].points
                        : "-"}
                    </TableCell>
                    <TableCell className="w-[10%]">
                      {request.phone_number ? (
                        <div className="flex flex-col space-y-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs text-center ${
                              loyaltyInfo[request.phone_number]?.point_status === "approved"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : loyaltyInfo[request.phone_number]?.point_status === "rejected"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                            }`}
                          >
                            {loyaltyInfo[request.phone_number]?.point_status === "approved"
                              ? t("approved") || "Approved"
                              : loyaltyInfo[request.phone_number]?.point_status === "rejected"
                              ? t("rejected") || "Rejected"
                              : t("pending") || "Pending"}
                          </span>
                          <div className="flex space-x-1 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/40 px-2 py-0 h-6"
                              onClick={() => updatePointStatus(request.phone_number as string, "approved")}
                            >
                              ✓
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40 px-2 py-0 h-6"
                              onClick={() => updatePointStatus(request.phone_number as string, "rejected")}
                            >
                              ✗
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/40 px-2 py-0 h-6"
                              onClick={() => updatePointStatus(request.phone_number as string, "pending")}
                            >
                              ?
                            </Button>
                          </div>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="w-[10%]">
                      {request.phone_number && loyaltyInfo[request.phone_number]
                        ? loyaltyInfo[request.phone_number].points === 20
                          ? t("discount")
                           : loyaltyInfo[request.phone_number].points === 10
                          ? t("freeDrink")
                          : "-"
                        : "-"}
                    </TableCell>
                    
                    <TableCell className="w-[10%]">
                      {request.phone_number && loyaltyInfo[request.phone_number] ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`${
                            loyaltyInfo[request.phone_number].got_the_gift
                              ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/40"
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40"
                          } ${
                            (loyaltyInfo[request.phone_number].points < 10) 
                              ? "opacity-50 cursor-not-allowed" 
                              : ""
                          }`}
                          onClick={() => {
                            // Only allow toggle if customer has at least 10 points
                            if (loyaltyInfo[request.phone_number].points >= 10) {
                              toggleGiftStatus(
                                request.phone_number as string,
                                loyaltyInfo[request.phone_number].got_the_gift
                              );
                            }
                          }}
                        >
                          {loyaltyInfo[request.phone_number].got_the_gift
                            ? t("giftReceived")
                            : t("giftNotReceived")}
                        </Button>
                      ) : "-"}
                    </TableCell>
                   
                    <TableCell className="w-[11.1%]">
                      <div className="flex space-x-2">
                        {request.status === "pending" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-400 mx-[10px] text-green-900 border-green-200 hover:bg-green-500 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/40"
                            onClick={() => markAsCompleted(request.id)}
                          >
                            {t("markComplete")}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-yellow-50 mx-[10px] text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/40"
                            onClick={() => markAsPending(request.id)}
                          >
                            {t("markPending")}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40"
                          onClick={() => deleteRequest(request.id)}
                        >
                          {t("delete") || "حذف"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default StaffDashboard;