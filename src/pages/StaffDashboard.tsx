import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeLanguageToggle from "@/components/ThemeLanguageToggle";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useLoading } from "@/contexts/LoadingContext";
import { getLoyaltyPointsByUserId, updateGiftForLoyaltyByUserId, registerLoyaltyVisitByUserId } from '@/integrations/supabase/loyalty';
import { log } from "console";
import { syncGiftWithPoints } from '@/integrations/supabase/loyalty';
interface WaiterRequest {
  id: string;
  table_number: number;
  request: string | null;
  status: string;
  created_at: string;
  phone_number: string | null;
  deleted: boolean;
  finished_at?: string;
  user_name?: string;
  user_id: string;
}

interface LoyaltyInfo {
  phone_number: string;
  points: number;
  status: string | null;
  got_the_gift: boolean | null;
  point_status: 'approved' | 'pending' | 'rejected' | null;
  gift?: string | null;
}

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState<WaiterRequest[]>([]);
  const [loyaltyInfo, setLoyaltyInfo] = useState<Record<string, LoyaltyInfo>>({});
  const { logout } = useAdminAuth();
  const { setLoading } = useLoading();

  const kanbanColumns = [
    { key: "new", title: t("newOrders") },
    { key: "pending", title: t("pending") },
    { key: "completed", title: t("completed") },
  ];

  // Group requests by status for Kanban columns
  const requestsByStatus: Record<string, WaiterRequest[]> = {
    new: [],
    pending: [],
    completed: [],
  };
  requests.forEach((req) => {
    if (req.status === "completed") requestsByStatus.completed.push(req);
    else if (req.status === "pending") requestsByStatus.pending.push(req);
    else requestsByStatus.new.push(req); // All others (default/new) go to 'new'
  });

  // Mark request as completed
  const markAsCompleted = async (id: string) => {
    try {
      // ابحث عن الطلب للحصول على created_at
      const req = requests.find((r) => r.id === id);
      let responseSeconds: number | null = null;
      if (req && req.created_at) {
        const created = new Date(req.created_at).getTime();
        const now = Date.now();
        responseSeconds = Math.floor((now - created) / 1000);
      }
      const nowISO = new Date().toISOString();
      const { error } = await supabase
        .from("waiter_requests")
        .update({ status: "completed", finished_at: nowISO, ...(responseSeconds !== null ? { response_time: responseSeconds } : {}) })
        .eq("id", id);
      if (error) {
        throw error;
      }
      setRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: "completed", finished_at: nowISO, ...(responseSeconds !== null ? { response_time: responseSeconds } : {}) } : req
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

  // Mark request as new
  const markAsNew = async (id: string) => {
    try {
      const { error } = await supabase
        .from("waiter_requests")
        .update({ status: "new" })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: "new" } : req
        )
      );

      toast({
        title: "تمت إعادة الطلب كجديد",
        description: "تم نقل الطلب إلى قائمة الطلبات الجديدة.",
      });
    } catch (error) {
      console.error("Error marking request as new:", error);
      toast({
        title: "فشل في إعادة الطلب كجديد",
        description: "حدث خطأ أثناء إعادة الطلب كجديد.",
        variant: "destructive",
      });
    }
  };

  // Optimistic drag end handler (moved below markAsCompleted/markAsPending)
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    if (sourceCol === destCol) return;
    // Optimistically update UI before awaiting DB
    setRequests((prev) =>
      prev.map((req) =>
        req.id === draggableId ? { ...req, status: destCol } : req
      )
    );
    // Find the request
    const request = requests.find((r) => r.id === draggableId);
    if (!request) return;
    // Move between columns: update status in DB
    if (destCol === "completed") {
      await markAsCompleted(request.id);
    } else if (destCol === "pending") {
      await markAsPending(request.id);
    } else if (destCol === "new") {
      // Move back to new (reset status)
      await markAsNew(request.id);
    }
  };

  // Fetch waiter requests and set up real-time subscription
  useEffect(() => {
    // Initial fetch of waiter requests
    const fetchRequests = async () => {
      setLoading(true);
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
          // Force all new requests to start as 'new' unless status is 'pending' or 'completed'
          console.log("Fetching waiter requests:", data, error);
          const normalized = data.map(req => {
            if (!('user_id' in req)) {
              return { ...req, user_id: "" };
            }
            return req;
          });
          setRequests(normalized as WaiterRequest[]);
          
          // Fetch loyalty information for phone numbers
          const phoneNumbers = normalized
            .filter(req => req.phone_number)
            .map(req => req.phone_number as string);
          
          if (phoneNumbers.length > 0) {
            fetchLoyaltyInfo(phoneNumbers);
          }

          // بعد جلب الطلبات من waiter_requests:
          const userIds = normalized.map(req => req.user_id).filter(Boolean);
          let loyaltyInfoObj = {};
          if (userIds.length > 0) {
            const { data: loyaltyData } = await supabase
              .from("loyalty_visits")
              .select("user_id, points, gift, got_the_gift")
              .in("user_id", userIds);
            if (loyaltyData && Array.isArray(loyaltyData)) {
              loyaltyData.forEach(item => {
                loyaltyInfoObj[item.user_id] = item;
              });
            }
          }
          setLoyaltyInfo(loyaltyInfoObj);
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
            fetchRequests();
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


  useEffect(() => {
    // مزامنة الهدايا مع النقاط عند فتح الصفحة
    syncGiftWithPoints();
  }, []);

  const fetchLoyaltyInfo = async (phoneNumbers: string[]) => {
    try {
      if (!phoneNumbers.length) return;
      // إزالة التكرار
      const uniquePhones = Array.from(new Set(phoneNumbers));
      // جلب السجلات الموجودة فقط
      const { data, error } = await supabase
        .from("loyalty_visits")
        .select("id, phone_number, points, status, got_the_gift, point_status, gift") // أضف gift هنا
        .in("phone_number", uniquePhones);

      if (error) {
        throw error;
      }

      const loyaltyData: Record<string, LoyaltyInfo> = {};
      const foundPhones = new Set<string>();
      if (data && data.length > 0) {
        data.forEach((item) => {
          if (item && typeof item === "object" && item !== null && "phone_number" in item) {
            const safeItem: LoyaltyInfo = {
              phone_number: (item as any).phone_number,
              points: (item as any).points,
              status: (item as any).status ?? null,
              got_the_gift: (item as any).got_the_gift === undefined || (item as any).got_the_gift === null ? false : (item as any).got_the_gift,
              point_status: (item as any).point_status || 'pending',
              gift: (item as any).gift || null,
            };
            foundPhones.add((item as any).phone_number);
            loyaltyData[(item as any).phone_number] = safeItem;
          }
        });
      }
      // فقط الأرقام التي لم يوجد لها سجل
      // @ts-ignore
      const phonesToCreate = uniquePhones.filter((phone: string) => !foundPhones.has(phone));
      if (phonesToCreate.length > 0) {
        const newEntries = phonesToCreate.map(phone => ({
          phone_number: phone,
          points: 0,
          status: null,
          got_the_gift: false,
          point_status: 'pending',
        }));
        // upsert فقط للأرقام الجديدة
        const { data: newData, error: insertError } = await supabase
          .from("loyalty_visits")
          .upsert(newEntries, { onConflict: "phone_number" })
          .select("id, phone_number, points, status, got_the_gift, point_status, gift");
        if (!insertError && Array.isArray(newData)) {
          newData.forEach(item => {
            // @ts-ignore
            if (item && typeof item === "object" && item !== null && "phone_number" in item) {
              // @ts-ignore
              loyaltyData[(item as any).phone_number] = {
                // @ts-ignore
                ...item,
                // @ts-ignore
                point_status: (item as any).point_status || 'pending',
                // @ts-ignore
                got_the_gift: (item as any).got_the_gift ?? false, // تأكد من وجود الخاصية
                gift: (item as any).gift || null,
              };
            }
          });
        } else if (insertError) {
          console.error("Error upserting new loyalty entries:", insertError);
        }
      }
      // عند الدمج، لا تعيد تعيين النقاط إذا كان السجل موجودًا
      setLoyaltyInfo((prev) => {
        const merged: Record<string, LoyaltyInfo> = { ...prev };
        Object.entries(loyaltyData).forEach(([phone, info]) => {
          // @ts-ignore
          const safeInfo = info as LoyaltyInfo;
          merged[phone] = {
            // @ts-ignore
            ...prev[phone],
            // @ts-ignore
            ...safeInfo,
            points: safeInfo.points !== undefined ? safeInfo.points : (prev[phone]?.points ?? 0),
            point_status: safeInfo.point_status || prev[phone]?.point_status || 'pending',
          };
        });
        return merged;
      });
    } catch (error) {
      console.error("Error fetching loyalty information:", error);
    }
  };

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

  const deleteRequest = async (id: string) => {
    try {
      // @ts-ignore
      const { error } = await supabase
        .from("waiter_requests")
        .update({ deleted: true } as any)
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
  
  const updatePointStatus = async (userId: string, status: 'approved' | 'pending' | 'rejected') => {
    try {
      // جلب بيانات الولاء الحالية للمستخدم
      const { data: currentDataArray, error: fetchError } = await supabase
        .from("loyalty_visits")
        .select("id, points, point_status")
        .eq("user_id", userId);
      if (fetchError) {
        throw fetchError;
      }
      let recordsToUse = currentDataArray || [];
      if (recordsToUse.length === 0) return;
      const currentData = recordsToUse[0];
      if (!currentData || typeof currentData !== 'object' || !('points' in currentData)) return;
      const currentPoints = (currentData as any).points || 0;
      const currentPointStatus = (currentData as any).point_status || 'pending';
      let updates: { point_status: string; points?: number } = { point_status: status };
      if (status === 'approved') {
        if (currentPointStatus === 'rejected' || currentPointStatus === 'pending') {
          updates.points = currentPoints + 1;
        } else {
          updates.points = currentPoints;
        }
      } else if (status === 'rejected') {
        if (currentPointStatus === 'approved') {
          updates.points = Math.max(0, currentPoints - 1);
        } else {
          updates.points = currentPoints;
        }
      } else {
        updates.points = currentPoints;
      }
      const { error } = await supabase
        .from("loyalty_visits")
        .update(updates as any)
        .eq("id", (currentData as any).id);
      if (error) {
        throw error;
      }
      setLoyaltyInfo((prev) => {
        const currentInfo = prev[userId] || {
          user_id: userId,
          points: 0,
          status: null,
          got_the_gift: false,
          point_status: 'pending',
        };
        let newPoints = currentInfo.points;
        if (status === 'approved') {
          if (currentInfo.point_status === 'rejected' || currentInfo.point_status === 'pending') {
            newPoints = currentInfo.points + 1;
          }
        } else if (status === 'rejected') {
          if (currentInfo.point_status === 'approved') {
            newPoints = Math.max(0, currentInfo.points - 1);
          }
        }
        return {
          ...prev,
          [userId]: {
            ...currentInfo,
            point_status: status,
            points: newPoints,
          },
        };
      });
      const messageMap = {
        approved: t("pointApproved"),
        rejected: t("pointRejected"),
        pending: t("pointPending"),
      };
      toast({
        title: t("success"),
        description: messageMap[status],
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

  const toggleGiftStatus = async (phoneNumber: string, currentStatus: boolean | null) => {
    try {
      const newStatus = !currentStatus;
      
      // @ts-ignore
      const { error } = await supabase
        .from("loyalty_visits")
        .update({ got_the_gift: newStatus } as any)
        .eq("phone_number", phoneNumber);

      if (error) {
        throw error;
      }

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "h:mm a", {
      locale: language === "ar" ? ar : enUS,
    });
  };

  // Helper to get seconds since request creation
  const getElapsedSeconds = (createdAt: string, status: string, finishedAt?: string) => {
    if (status === "completed" && finishedAt) {
      const created = new Date(createdAt).getTime();
      const finished = new Date(finishedAt).getTime();
      return Math.floor((finished - created) / 1000);
    }
    if (status === "completed") return null;
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.floor((now - created) / 1000);
  };

  // Timer component for each request
  const RequestTimer = ({ createdAt, status, finishedAt }: { createdAt: string; status: string; finishedAt?: string }) => {
    const [seconds, setSeconds] = useState(() => getElapsedSeconds(createdAt, status, finishedAt));
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (status === "completed") {
        setSeconds(getElapsedSeconds(createdAt, status, finishedAt));
        return;
      }
      setSeconds(getElapsedSeconds(createdAt, status));
      intervalRef.current = setInterval(() => {
        setSeconds(getElapsedSeconds(createdAt, status));
      }, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [createdAt, status, finishedAt]);

    let displaySeconds = seconds;
    if (status === "completed" && finishedAt) {
      displaySeconds = getElapsedSeconds(createdAt, status, finishedAt);
    }
    if (displaySeconds == null) return null;
    const mins = Math.floor(displaySeconds / 60);
    const secs = displaySeconds % 60;

    return (
      <span className="ml-2 flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-50 dark:from-yellow-900 dark:via-yellow-800 dark:to-yellow-700 shadow-sm border border-yellow-300 dark:border-yellow-800">
        <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        {mins}:{secs.toString().padStart(2, "0")} {mins > 0 ? "min" : "sec"}
        {status === "completed" && (
          <span className="ml-1 text-green-600 dark:text-green-300 font-bold">✓</span>
        )}
      </span>
    );
  };

  return (
    <PageTransition>
      <div className="w-[90%] mx-auto mt-[20px]">
        <div className="mb-6">
          <ThemeLanguageToggle />
        </div>
        <div className="flex flex-col items-center mb-8 relative">
          <div className="flex items-center w-full justify-between">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center">
              {t("staffDashboard")}
            </h1>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                className="bg-gold hover:bg-gold/90 text-black dark:bg-black dark:hover:bg-black/90 dark:text-gold"
                onClick={() => navigate("/loyalty-management")}
              >
               {t("generateDailyCode")}
              </Button>
              <Button
                variant="outline"
                className="bg-blue-100 hover:bg-blue-200 text-blue-900 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-gold"
                onClick={() => navigate("/reports")}
              >
                التقارير
              </Button>
              <Button variant="outline" className=" bg-red-400 text-white hover:bg-red-200" onClick={logout}>
                {t("logout")}
              </Button>
              <div className="relative">
                <Bell className="h-12 w-12 text-kian-charcoal dark:text-kian-sand" />
                {(requestsByStatus["new"].length + requestsByStatus["pending"].length) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {requestsByStatus["new"].length + requestsByStatus["pending"].length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        {requests.length === 0 ? (
          <div className="text-center py-12 px-4 text-[25px] border-2 border-dashed border-kian-sand dark:border-kian-burgundy rounded-xl">
            <Bell className="mx-auto h-16 w-16 text-kian-charcoal/30 dark:text-kian-sand/30 mb-4" />
            <p className="text-base sm:text-lg text-kian-charcoal/70 dark:text-kian-sand/70">
              {t("noRequests")}
            </p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-nowrap sm:flex-wrap gap-4 sm:gap-3 md:gap-6 overflow-x-auto sm:overflow-x-visible pb-4 justify-center w-full max-w-none">
              {kanbanColumns.map((col) => (
                <Droppable droppableId={col.key} key={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-white dark:bg-kian-burgundy rounded-xl shadow-lg min-w-[90vw] sm:min-w-[320px] sm:w-[320px] md:min-w-[340px] md:w-[340px] p-3 sm:p-4 flex flex-col transition-all duration-200 ease-in-out border-2 border-kian-sand dark:border-kian-burgundy ${snapshot.isDraggingOver ? "ring-2 ring-gold" : ""}`}
                    >
                      <h2
                        className={`text-lg sm:text-xl font-semibold mb-2 sm:mb-4 text-center rounded-full px-2 sm:px-4 py-1 sm:py-2 shadow-sm
                          ${col.key === "new"
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : col.key === "pending"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            : col.key === "completed"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : col.key === "removed"
                            ? "bg-red-100 text-red-700 border border-red-300"
                            : "bg-gray-100 text-gray-700 border border-gray-300"
                          }
                        `}
                      >
                        {col.title}
                      </h2>
                      <div className="flex-1 space-y-3 sm:space-y-4 min-h-[40px]">
                        {requestsByStatus[col.key].map((request, idx) => (
                          <Draggable draggableId={request.id} index={idx} key={request.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-kian-sand dark:bg-kian-charcoal rounded-lg shadow p-3 sm:p-4 transition-all duration-200 ease-in-out border border-kian-burgundy dark:border-kian-sand ${snapshot.isDragging ? "ring-2 ring-gold" : ""}`}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-200 to-yellow-100 text-yellow-900 font-bold shadow-sm border border-yellow-400 dark:from-yellow-900 dark:via-yellow-800 dark:to-yellow-700 dark:text-yellow-100 dark:border-yellow-700">
                                      {request.table_number}
                                    </span>
                                    <span className="font-semibold text-sm sm:text-base text-kian-burgundy dark:text-yellow-200 tracking-wide">
                                      {t("tableColumn")}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500 flex items-center gap-2">
                                    {formatDate(request.created_at)}
                                    <RequestTimer createdAt={request.created_at} status={request.status} finishedAt={request.finished_at} />
                                  </span>
                                </div>
                                <div className="mb-2 flex items-center gap-2">
                                  <span className="font-semibold text-kian-charcoal dark:text-yellow-100 text-sm">
                                    {t("requestColumn")}:
                                  </span>
                                  <span className="text-sm sm:text-[15px] font-medium text-kian-burgundy dark:text-yellow-200">
                                    {request.request || t("noSpecificRequest")}
                                  </span>
                                </div>
                                <div className="mb-2 flex items-center gap-2">
                                  <span className="font-semibold text-kian-charcoal dark:text-yellow-100 text-sm">
                                    {t("phoneNumber")}:
                                  </span>
                                  <span className="text-sm sm:text-[15px] font-medium text-kian-burgundy dark:text-yellow-200">
                                    {request.phone_number || "-"}
                                  </span>
                                </div>
                                <div className="mb-2 flex items-center gap-2">
                                  <span className="font-semibold text-kian-charcoal dark:text-yellow-100 text-sm">{t("userName")}: {request.user_name || "-"}</span>
                                </div>

                                
                                <div className="mb-2 flex flex-col items-start flex-wrap gap-2 ">
                                  <span className="font-semibold text-kian-charcoal dark:text-yellow-100 text-sm">
                                    {t("points")}:  <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-br from-green-200 via-green-100 to-green-50 text-green-900 font-bold text-xs shadow border border-green-300 dark:from-green-900 dark:via-green-800 dark:to-green-700 dark:text-green-100 dark:border-green-700">
                                      {request.user_id && loyaltyInfo[request.user_id]?.points !== undefined
                                        ? loyaltyInfo[request.user_id]?.points
                                        : "-"}
                                    </span>
                                  </span>
                                 
                                </div>


                                <div className="mb-2 flex flex-col flex-wrap gap-2 items-start">
                                  <span className="font-semibold text-kian-charcoal dark:text-yellow-100 text-sm">
                                    {t("gift")}:  <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-br from-purple-200 via-purple-100 to-purple-50 text-purple-900 font-bold text-xs shadow border border-purple-300 dark:from-purple-900 dark:via-purple-800 dark:to-purple-700 dark:text-purple-100 dark:border-purple-700">
                                      {request.user_id && loyaltyInfo[request.user_id]?.gift
                                        ? (() => {
                                            const giftKey = loyaltyInfo[request.user_id]?.gift;
                                            const gotGift = loyaltyInfo[request.user_id]?.got_the_gift;
                                            if (giftKey === "العميل كان له مشروب مجاني" && gotGift === true) {
                                              return t("customerGiftIfThePointsMoreThanTenAndReceived") || "العميل حصل على مشروب مجاني";
                                            } else if (giftKey === "العميل كان له خصم 20%" && gotGift === true) {
                                              return t("customerGiftIfThePointsMoreThanTwentyAndReceived") || "العميل حصل على خصم 20%";
                                            } else if (giftKey === "العميل كان له خصم 20%" && gotGift === false) {
                                              return t("customerGiftIfThePointsMoreThanTwentyAndNotReceived") || "العميل لم يحصل على خصم 20% بعد";
                                            } else if (giftKey === "العميل كان له مشروب مجاني" && gotGift === false) {
                                              return t("customerGiftIfThePointsMoreThanTenAndNotReceived") || "العميل لم يحصل على مشروب مجاني بعد";
                                            } else if (giftKey === "مشروب مجاني") {
                                              return t("customerGiftIfThePointsArenTen") || "العميل وصل إلى 10 نقاط (مشروب مجاني)";
                                            } else if (giftKey === "خصم 20%") {
                                              return t("customerGiftIfThePointsArenTwenty") || "العميل وصل إلى 20 نقطة (خصم 20%)";
                                            } else {
                                              return "-";
                                            }
                                          })()
                                        : "-"}
                                  </span>
                                  </span>
                                 
                                  <span className="font-semibold ml-2 text-kian-charcoal dark:text-yellow-100 text-sm">
                                    {t("giftStatus")}:  {request.user_id && loyaltyInfo[request.user_id] ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className={`ml-2 px-2 py-1 rounded-full font-bold text-xs shadow border transition-all duration-150 ${
                                        loyaltyInfo[request.user_id].got_the_gift
                                          ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/40"
                                          : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40"
                                      } ${
                                        loyaltyInfo[request.user_id].points < 10
                                          ? "opacity-50 cursor-not-allowed"
                                          : ""
                                      }`}
                                      onClick={() => {
                                        if (loyaltyInfo[request.user_id].points >= 10) {
                                          toggleGiftStatus(
                                            request.phone_number as string,
                                            loyaltyInfo[request.user_id].got_the_gift
                                          );
                                        }
                                      }}
                                    >
                                      {loyaltyInfo[request.user_id].got_the_gift
                                        ? t("giftReceived")
                                        : t("giftNotReceived")}
                                    </Button>
                                  ) : "-"}
                                  </span>
                                  
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                                 
                                  {col.key === "pending" ? (
                                    <>
                                     <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/40 px-2 py-0 h-7 rounded-full font-bold text-xs shadow border border-blue-300 dark:border-blue-700"
                                        onClick={() => markAsNew(request.id)}
                                      >
                                        إعادة كجديد
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-green-400 text-green-900 border-green-200 hover:bg-green-500 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/40 px-2 py-0 h-7 rounded-full font-bold text-xs shadow border border-green-300 dark:border-green-700"
                                        onClick={() => markAsCompleted(request.id)}
                                      >
                                        {t("markComplete")}
                                      </Button>
                                     
                                    </>
                                  ) : col.key === "new" ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/40 px-2 py-0 h-7 rounded-full font-bold text-xs shadow border border-yellow-300 dark:border-yellow-700"
                                      onClick={() => markAsPending(request.id)}
                                    >
                                      {t("markPending")}
                                    </Button>
                                  ) : col.key === "completed" ? (
                                    <>
                                       <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/40 px-2 py-0 h-7 rounded-full font-bold text-xs shadow border border-blue-300 dark:border-blue-700"
                                        onClick={() => markAsNew(request.id)}
                                      >
                                        إعادة كجديد
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/40 px-2 py-0 h-7 rounded-full font-bold text-xs shadow border border-yellow-300 dark:border-yellow-700"
                                        onClick={() => markAsPending(request.id)}
                                      >
                                        {t("markPending")}
                                      </Button>
                                   
                                     
                                    </>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/40 px-2 py-0 h-7 rounded-full font-bold text-xs shadow border border-blue-300 dark:border-blue-700"
                                    >
                                      إعادة كجديد
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40 px-2 py-0 h-7 rounded-full font-bold text-xs shadow border border-red-300 dark:border-red-700"
                                    onClick={() => deleteRequest(request.id)}
                                  >
                                    {t("delete") || "حذف"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>
    </PageTransition>
  );
};

export default StaffDashboard;