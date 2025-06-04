import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Pie, PieChart, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 , ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import PageTransition from "@/components/PageTransition";
import ThemeLanguageToggle from "@/components/ThemeLanguageToggle";
import { useNavigate } from "react-router-dom";

const COLORS = ["#FFD700", "#FFB300", "#FF7043", "#29B6F6", "#66BB6A", "#AB47BC", "#EC407A", "#789262", "#FFA726", "#8D6E63"];

export default function Reports() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [waiterRequests, setWaiterRequests] = useState<any[]>([]);
  const [loyaltyVisits, setLoyaltyVisits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("summary");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [{ data: requests }, { data: loyalty }] = await Promise.all([
        supabase.from("waiter_requests").select("*"),
        supabase.from("loyalty_visits").select("*"),
      ]);
      setWaiterRequests(requests || []);
      setLoyaltyVisits(loyalty || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // --- حذف المتغيرات القديمة الخاصة بالمنتجات ---
  // --- جلب بيانات المنتجات من جدول items ---
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    async function fetchItems() {
      const { data } = await supabase.from("items").select("name_ar, name_en, price, points");
      setItems(data || []);
    }
    fetchItems();
  }, []);

  // --- ربط الطلبات بالمنتجات الفعلية ---
  function getItemByRequest(request: string) {
    return items.find(
      (item) =>
        item.name_ar === request ||
        item.name_en === request ||
        request.includes(item.name_ar) ||
        request.includes(item.name_en)
    );
  }

  // المنتجات الأكثر طلباً (حسب الطلبات المرتبطة بمنتجات items)
  const productOrderMap: Record<string, { name: string; count: number }> = {};
  waiterRequests.forEach((r) => {
    if (!r.request || r.request === "لا يوجد طلب محدد") return;
    const item = getItemByRequest(r.request);
    if (item) {
      const key = item.name_ar;
      if (!productOrderMap[key]) productOrderMap[key] = { name: item.name_ar, count: 0 };
      productOrderMap[key].count += 1;
    }
  });
  const topProductsFinal = Object.values(productOrderMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  // المنتجات الأعلى إيراداً (حسب الطلبات المرتبطة بمنتجات items)
  const productRevenueMap: Record<string, { name: string; revenue: number }> = {};
  waiterRequests.forEach((r) => {
    if (!r.request || r.request === "لا يوجد طلب محدد") return;
    const item = getItemByRequest(r.request);
    if (item) {
      const key = item.name_ar;
      if (!productRevenueMap[key]) productRevenueMap[key] = { name: item.name_ar, revenue: 0 };
      productRevenueMap[key].revenue += item.price || 0;
    }
  });
  const topRevenueProductsFinal = Object.values(productRevenueMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 7);

  // --- تقارير جديدة مفيدة ---
  // 1. عدد العملاء الفريدين
  const uniqueCustomers = new Set(loyaltyVisits.map((v) => v.phone_number)).size;
  // 2. أفضل العملاء
  const topCustomers = [...loyaltyVisits]
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);
  // 3. توزيع النقاط والمكافآت
  const rewardStats = {
    free_drink: loyaltyVisits.filter((v) => v.points >= 10 && v.points < 20).length,
    special_discount: loyaltyVisits.filter((v) => v.points >= 20).length,
  };
  // 4. زيارات الولاء اليومية
  const loyaltyByDay = loyaltyVisits.reduce((acc, v) => {
    const day = v.last_visit ? v.last_visit.split("T")[0] : "";
    if (!day) return acc;
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const loyaltyByDayArr = Object.entries(loyaltyByDay).map(([date, count]) => ({ date, count }));
  // 5. معدل الاحتفاظ (عميل زار مرتين أو أكثر)
  const retainedCustomers = loyaltyVisits.filter((v) => v.points > 1).length;
  // 6. عدد الطلبات لكل طاولة
  const requestsByTable = waiterRequests.reduce((acc, r) => {
    acc[r.table_number] = (acc[r.table_number] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const requestsByTableArr = Object.entries(requestsByTable).map(([table, count]) => ({ table, count }));
  // 7. متوسط زمن الاستجابة بالدقائق
  const avgResponse = (() => {
    // الطلبات المكتملة فقط (status === "completed")
    const completed = waiterRequests.filter(
      (r) => r.status === "completed" && r.created_at && (r.response_time !== undefined || (r.finished_at && r.created_at))
    );
    if (!completed.length) return 0;
    // استخدم response_time إذا كان موجودًا، وإلا احسب الفرق بين finished_at و created_at
    const totalSeconds = completed.reduce((sum, r) => {
      if (typeof r.response_time === "number" && !isNaN(r.response_time)) {
        return sum + r.response_time;
      } else if (r.finished_at && r.created_at) {
        const start = new Date(r.created_at).getTime();
        const end = new Date(r.finished_at).getTime();
        return sum + Math.round((end - start) / 1000);
      }
      return sum;
    }, 0);
    // حساب المتوسط بالدقائق مع تقريب منزلتين عشرية
    return +(totalSeconds / completed.length / 60).toFixed(2);
  })();
  // 8. الطلبات حسب الحالة
  const statusStats = waiterRequests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  // 9. أكثر الطلبات شيوعًا
  const topRequests = (() => {
    const map = {} as Record<string, number>;
    waiterRequests.forEach((r) => {
      if (r.request && r.request !== "لا يوجد طلب محدد") map[r.request] = (map[r.request] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([request, count]) => ({ request, count }));
  })();
  // 10. توزيع الطلبات على مدار اليوم (ساعة)
  const requestsByHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  waiterRequests.forEach((r) => {
    if (r.created_at) {
      const hour = new Date(r.created_at).getHours();
      requestsByHour[hour].count++;
    }
  });
  // 11. وقت الذروة وعدد الطلبات فيه
  const peak = requestsByHour.reduce((max, cur) => (cur.count > max.count ? cur : max), { hour: 0, count: 0 });

  // --- تقارير جديدة مفيدة ---
  // 1. أكثر العملاء طلباً (بالاسم)
  const ordersByUser = waiterRequests.reduce((acc, r) => {
    if (r.user_name) acc[r.user_name] = (acc[r.user_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topUsers = Object.entries(ordersByUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([user, count]) => ({ user, count }));

  // 2. عدد النقاط الموزعة
  const totalPoints = loyaltyVisits.reduce((sum, v) => sum + (v.points || 0), 0);

  // 3. عدد المشتريات بنقاط الولاء
  const loyaltyPurchases = waiterRequests.filter(r => r.request && r.request.includes("نقاط الولاء")).length;

  // 4. عدد المشتريات النقدية
  const cashPurchases = waiterRequests.filter(r => r.request && !r.request.includes("نقاط الولاء")).length;

  // 5. أكثر المنتجات طلباً (نفس منطق أكثر الطلبات شيوعًا مع تجاهل "لا يوجد طلب محدد")
  const productOrders = waiterRequests.reduce((acc, r) => {
    if (r.request && r.request !== "لا يوجد طلب محدد") {
      acc[r.request] = (acc[r.request] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const topProducts = Object.entries(productOrders)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, count]) => ({ name, count }));

  // معدل الاحتفاظ بالعملاء (نسبة العملاء الذين زاروا مرتين أو أكثر إلى إجمالي العملاء الفريدين)
  const retainedCustomersCount = loyaltyVisits.filter((v) => v.points > 1).length;
  const retentionRate = uniqueCustomers > 0 ? ((retainedCustomersCount / uniqueCustomers) * 100).toFixed(1) : 0;

  // --- تقارير مالية وتحليلية ---
  // 1. إجمالي الإيرادات ومتوسط قيمة الطلب (من جدول items)
  let totalRevenue = 0;
  let orderCountWithPrice = 0;
  waiterRequests.forEach((r) => {
    if (!r.request || r.request === "لا يوجد طلب محدد") return;
    const item = getItemByRequest(r.request);
    if (item && typeof item.price === 'number') {
      totalRevenue += item.price;
      orderCountWithPrice += 1;
    }
  });
  const avgOrderValue = orderCountWithPrice > 0 ? (totalRevenue / orderCountWithPrice).toFixed(2) : '0';

  // 2. توزيع الإيرادات حسب نوع الدفع (نقدي/نقاط الولاء)
  let cashRevenue = 0;
  let loyaltyRevenue = 0;
  waiterRequests.forEach((r) => {
    if (!r.request || r.request === "لا يوجد طلب محدد") return;
    const item = getItemByRequest(r.request);
    if (item && typeof item.price === 'number') {
      if (r.request.includes("نقاط الولاء")) {
        loyaltyRevenue += item.price;
      } else {
        cashRevenue += item.price;
      }
    }
  });

  // العملاء الأعلى إنفاقًا (حسب ربط الطلبات بالمنتجات)
  const revenueByUser: Record<string, number> = {};
  waiterRequests.forEach((r) => {
    if (!r.user_name || !r.request || r.request === "لا يوجد طلب محدد") return;
    const item = getItemByRequest(r.request);
    if (item && typeof item.price === 'number') {
      revenueByUser[r.user_name] = (revenueByUser[r.user_name] || 0) + item.price;
    }
  });
  const topSpenders = Object.entries(revenueByUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([user, revenue]) => ({ user, revenue }));

  // تطور الإيرادات اليومية (حسب price من جدول items)
  const revenueByDay: Record<string, number> = {};
  const ordersByDay: Record<string, number> = {};
  waiterRequests.forEach((r) => {
    if (!r.request || r.request === "لا يوجد طلب محدد") return;
    const item = getItemByRequest(r.request);
    if (item && typeof item.price === 'number' && r.created_at) {
      const day = r.created_at.split("T")[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + item.price;
      ordersByDay[day] = (ordersByDay[day] || 0) + 1;
    }
  });
  const revenueByDayArr = Object.entries(revenueByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));
  const ordersRevenueCompare = Object.keys(revenueByDay)
    .sort((a, b) => a.localeCompare(b))
    .map(date => ({
      date,
      orders: ordersByDay[date] || 0,
      revenue: revenueByDay[date] || 0
    }));

  return (
    <PageTransition>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">التقارير</h1>
          <div className="flex gap-4 items-center">
            <ThemeLanguageToggle />
            <button
              className="px-4 flex items-center gap-[10px] py-2 rounded bg-kian-gold ring-4 ring-gold text-black font-bold border hover:bg-yellow-400 transition"
              onClick={() => navigate("/staff-dashboard")}
            >
              <ArrowRight className="mr-2" />
              العودة للداشبورد
            </button>
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white font-bold border hover:bg-blue-700 transition print:hidden"
              onClick={() => window.print()}
            >
              طباعة التقارير
            </button>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 flex flex-wrap gap-2">
            <TabsTrigger value="summary">ملخص عام</TabsTrigger>
            <TabsTrigger value="financial">تقارير مالية</TabsTrigger>
            <TabsTrigger value="products">تقارير المنتجات</TabsTrigger>
            <TabsTrigger value="customers">تقارير العملاء</TabsTrigger>
            <TabsTrigger value="loyalty">تقارير الولاء</TabsTrigger>
            <TabsTrigger value="operations">تشغيلية</TabsTrigger>
          </TabsList>
          {/* ملخص عام */}
          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* أكثر العملاء طلباً */}
              {/* ...يمكنك نقل بعض الكروت المختصرة هنا... */}
              <Card>
                <CardHeader>
                  <CardTitle>عدد العملاء الفريدين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-700">{uniqueCustomers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>إجمالي الإيرادات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-700 mb-2">{totalRevenue.toLocaleString()} جنيه</div>
                  <div>إجمالي الدخل من جميع الطلبات</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>متوسط قيمة الطلب</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700 mb-2">{avgOrderValue} جنيه</div>
                  <div>متوسط الدخل لكل طلب</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>معدل الاحتفاظ بالعملاء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700 mb-2">{retentionRate}%</div>
                  <div>نسبة العملاء الذين زاروا مرتين أو أكثر</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* تقارير مالية */}
          <TabsContent value="financial">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* إجمالي الإيرادات */}
              <Card>
                <CardHeader>
                  <CardTitle>إجمالي الإيرادات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-700 mb-2">{totalRevenue.toLocaleString()} جنيه</div>
                  <div>إجمالي الدخل من جميع الطلبات</div>
                </CardContent>
              </Card>
              {/* متوسط قيمة الطلب */}
              <Card>
                <CardHeader>
                  <CardTitle>متوسط قيمة الطلب</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700 mb-2">{avgOrderValue} جنيه</div>
                  <div>متوسط الدخل لكل طلب</div>
                </CardContent>
              </Card>
              {/* توزيع الإيرادات حسب نوع الدفع */}
              <Card>
                <CardHeader>
                  <CardTitle>توزيع الإيرادات حسب نوع الدفع</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={[
                        { name: "نقدي", value: cashRevenue },
                        { name: "نقاط الولاء", value: loyaltyRevenue },
                      ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                        <Cell fill="#66BB6A" />
                        <Cell fill="#FF7043" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-between mt-4">
                    <span className="font-bold text-green-700">نقدي: {cashRevenue.toLocaleString()} جنيه</span>
                    <span className="font-bold text-orange-700">نقاط الولاء: {loyaltyRevenue.toLocaleString()} جنيه</span>
                  </div>
                </CardContent>
              </Card>
              {/* إجمالي إيرادات الطلبات النقدية */}
              <Card>
                <CardHeader>
                  <CardTitle>إجمالي إيرادات الطلبات النقدية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700 mb-2">{cashRevenue.toLocaleString()} جنيه</div>
                  <div>إجمالي الدخل من الطلبات المدفوعة نقدًا</div>
                </CardContent>
              </Card>
              {/* إجمالي إيرادات الطلبات بنقاط الولاء */}
              <Card>
                <CardHeader>
                  <CardTitle>إجمالي إيرادات الطلبات بنقاط الولاء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-700 mb-2">{loyaltyRevenue.toLocaleString()} جنيه</div>
                  <div>إجمالي الدخل من الطلبات المدفوعة بنقاط الولاء</div>
                </CardContent>
              </Card>
              {/* تطور الإيرادات عبر الزمن */}
              <Card>
                <CardHeader>
                  <CardTitle>تطور الإيرادات اليومية</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={revenueByDayArr}>
                      <XAxis dataKey="date" tickFormatter={d => d.slice(5)} />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={v => `${v} جنيه`} />
                      <Bar dataKey="revenue" fill="#AB47BC" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              {/* مقارنة عدد الطلبات والإيرادات يوميًا */}
              <Card>
                <CardHeader>
                  <CardTitle>مقارنة عدد الطلبات والإيرادات اليومية</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={ordersRevenueCompare}>
                      <XAxis dataKey="date" tickFormatter={d => d.slice(5)} />
                      <YAxis yAxisId="left" allowDecimals={false} />
                      <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
                      <Tooltip formatter={(v, n) => n === 'revenue' ? `${v} جنيه` : v} />
                      <Bar yAxisId="left" dataKey="orders" fill="#29B6F6" name="عدد الطلبات" />
                      <Bar yAxisId="right" dataKey="revenue" fill="#FFA726" name="الإيراد" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* تقارير المنتجات */}
          <TabsContent value="products">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* أكثر المنتجات طلباً */}
              <Card>
                <CardHeader>
                  <CardTitle>أكثر المنتجات طلباً</CardTitle>
                </CardHeader>
                <CardContent>
                  {topProductsFinal.length === 0 ? (
                    <div className="text-center text-gray-400">لا توجد بيانات منتجات</div>
                  ) : (
                    <div className="max-h-56 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المنتج</TableHead>
                            <TableHead>عدد الطلبات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topProductsFinal.map((row, idx) => (
                            <TableRow key={row.name} className={idx === 0 ? 'bg-yellow-100 font-bold' : ''}>
                              <TableCell className="text-base">{row.name}</TableCell>
                              <TableCell className="text-center text-lg">{String(row.count)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* المنتجات الأعلى إيرادًا */}
              <Card>
                <CardHeader>
                  <CardTitle>المنتجات الأعلى إيرادًا</CardTitle>
                </CardHeader>
                <CardContent>
                  {topRevenueProductsFinal.length === 0 ? (
                    <div className="text-center text-gray-400">لا توجد بيانات إيرادات منتجات</div>
                  ) : (
                    <div className="max-h-56 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المنتج</TableHead>
                            <TableHead>الإيراد (جنيه)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topRevenueProductsFinal.map((row, idx) => (
                            <TableRow key={row.name} className={idx === 0 ? 'bg-green-100 font-bold' : ''}>
                              <TableCell className="text-base">{row.name}</TableCell>
                              <TableCell className="text-center text-lg">{row.revenue.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* تقارير العملاء */}
          <TabsContent value="customers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* أكثر العملاء طلباً */}
              <Card>
                <CardHeader>
                  <CardTitle>أكثر العملاء طلباً</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={topUsers} layout="vertical">
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="user" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#29B6F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              {/* العملاء الأعلى إنفاقًا */}
              <Card>
                <CardHeader>
                  <CardTitle>العملاء الأعلى إنفاقًا</CardTitle>
                </CardHeader>
                <CardContent>
                  {topSpenders.length === 0 ? (
                    <div className="text-center text-gray-400">لا توجد بيانات عملاء</div>
                  ) : (
                    <div className="max-h-56 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>العميل</TableHead>
                            <TableHead>الإجمالي (جنيه)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topSpenders.map((row, idx) => (
                            <TableRow key={row.user} className={idx === 0 ? 'bg-blue-100 font-bold' : ''}>
                              <TableCell className="text-base">{row.user}</TableCell>
                              <TableCell className="text-center text-lg">{row.revenue.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* أفضل العملاء (جدول) */}
              <Card>
                <CardHeader>
                  <CardTitle>أفضل العملاء (حسب النقاط)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>رقم الجوال</TableHead>
                        <TableHead>النقاط</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCustomers.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell>{c.user_name || '-'}</TableCell>
                          <TableCell>{c.phone_number || '-'}</TableCell>
                          <TableCell>{c.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* تقارير الولاء */}
          <TabsContent value="loyalty">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* عدد النقاط الموزعة */}
              <Card>
                <CardHeader>
                  <CardTitle>إجمالي النقاط الموزعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-kian-gold mb-4">{totalPoints}</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={loyaltyVisits.map(v => ({ name: v.user_name || v.phone_number || "-", value: v.points }))}>
                      <XAxis dataKey="name" hide />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#AB47BC" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              {/* زيارات الولاء اليومية */}
              <Card>
                <CardHeader>
                  <CardTitle>زيارات الولاء اليومية</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={loyaltyByDayArr}>
                      <XAxis dataKey="date" tickFormatter={d => d.slice(5)} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#29B6F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              {/* مقارنة المشتريات بنقاط الولاء والمشتريات النقدية */}
              <Card>
                <CardHeader>
                  <CardTitle>المشتريات حسب نوع الدفع</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={[
                        { name: "نقاط الولاء", value: loyaltyPurchases },
                        { name: "نقدي", value: cashPurchases },
                      ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                        <Cell fill="#66BB6A" />
                        <Cell fill="#FF7043" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-between mt-4">
                    <span className="font-bold text-green-700">مشتريات بنقاط الولاء: {loyaltyPurchases}</span>
                    <span className="font-bold text-orange-700">مشتريات نقدية: {cashPurchases}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* تقارير تشغيلية */}
          <TabsContent value="operations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* الطلبات لكل طاولة */}
              <Card>
                <CardHeader>
                  <CardTitle>الطلبات لكل طاولة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>رقم الطاولة</TableHead>
                          <TableHead>عدد الطلبات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requestsByTableArr.map(row => (
                          <TableRow key={row.table}>
                            <TableCell>{row.table}</TableCell>
                            <TableCell>{row.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              {/* متوسط زمن الاستجابة */}
              <Card>
                <CardHeader>
                  <CardTitle>متوسط زمن الاستجابة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700 mb-2">{avgResponse} دقيقة</div>
                  <div>للطلبات المكتملة</div>
                </CardContent>
              </Card>
              {/* الطلبات حسب الحالة */}
              <Card>
                <CardHeader>
                  <CardTitle>الطلبات حسب الحالة</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {Object.entries(statusStats).map(([status, count], i) => (
                      <li key={status} className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>
                        <span className="font-bold">{status}</span>
                        <span className="ml-2">{String(count)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              {/* أكثر الطلبات شيوعًا */}
              <Card>
                <CardHeader>
                  <CardTitle>أكثر الطلبات شيوعًا</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الطلب</TableHead>
                          <TableHead>عدد المرات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topRequests.map(row => (
                          <TableRow key={row.request}>
                            <TableCell>{row.request}</TableCell>
                            <TableCell>{row.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              {/* توزيع الطلبات على مدار اليوم */}
              <Card>
                <CardHeader>
                  <CardTitle>توزيع الطلبات على مدار اليوم</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={requestsByHour}>
                      <XAxis dataKey="hour" tickFormatter={h => `${h}:00`} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FFB300" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              {/* وقت الذروة */}
              <Card>
                <CardHeader>
                  <CardTitle>وقت الذروة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-700 mb-2">{peak.hour}:00</div>
                  <div>عدد الطلبات: <span className="font-bold">{peak.count}</span></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
