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
      if (r.request) map[r.request] = (map[r.request] || 0) + 1;
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="summary">ملخص</TabsTrigger>
            <TabsTrigger value="loyalty">الولاء</TabsTrigger>
            <TabsTrigger value="requests">الطلبات</TabsTrigger>
            <TabsTrigger value="peak">وقت الذروة</TabsTrigger>
            
          </TabsList>
          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>عدد العملاء الفريدين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-kian-gold">{uniqueCustomers}</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={[{ name: "عملاء فريدين", value: uniqueCustomers }, { name: "باقي العملاء", value: Math.max(loyaltyVisits.length - uniqueCustomers, 0) }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40}>
                        <Cell fill="#FFD700" />
                        <Cell fill="#E0E0E0" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>عملاء متكررين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-kian-gold">{retainedCustomers}</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={[{ name: "متكررين", value: retainedCustomers }, { name: "غير متكررين", value: Math.max(loyaltyVisits.length - retainedCustomers, 0) }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40}>
                        <Cell fill="#FF7043" />
                        <Cell fill="#E0E0E0" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>إجمالي الطلبات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-kian-gold">{waiterRequests.length}</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={requestsByTableArr}>
                      <XAxis dataKey="table" />
                      <YAxis allowDecimals={false} hide />
                      <Tooltip />
                      <Bar dataKey="count" fill="#29B6F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>متوسط زمن الاستجابة (دقيقة)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-kian-gold">{avgResponse}</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={waiterRequests.filter(r => r.status === "completed").map(r => ({ name: r.table_number, value: (typeof r.response_time === "number" ? r.response_time / 60 : r.finished_at && r.created_at ? (new Date(r.finished_at).getTime() - new Date(r.created_at).getTime()) / 1000 / 60 : 0) }))}>
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#66BB6A" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              {/* معلومات إضافية */}
              <Card>
                <CardHeader>
                  <CardTitle>إجمالي النقاط الموزعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-kian-gold">{loyaltyVisits.reduce((sum, v) => sum + (v.points || 0), 0)}</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={loyaltyVisits.map(v => ({ name: v.phone_number, value: v.points }))}>
                      <XAxis dataKey="name" hide />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#AB47BC" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>عدد العملاء الذين حصلوا على هدية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-kian-gold">{loyaltyVisits.filter(v => v.got_the_gift).length}</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={[{ name: "حصلوا على هدية", value: loyaltyVisits.filter(v => v.got_the_gift).length }, { name: "لم يحصلوا", value: loyaltyVisits.length - loyaltyVisits.filter(v => v.got_the_gift).length }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40}>
                        <Cell fill="#EC407A" />
                        <Cell fill="#E0E0E0" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>عدد العملاء الذين حصلوا على خصم</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-kian-gold">{loyaltyVisits.filter(v => v.points >= 20).length}</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={[{ name: "حصلوا على خصم", value: loyaltyVisits.filter(v => v.points >= 20).length }, { name: "لم يحصلوا", value: loyaltyVisits.length - loyaltyVisits.filter(v => v.points >= 20).length }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40}>
                        <Cell fill="#789262" />
                        <Cell fill="#E0E0E0" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>أكثر طاولة عليها طلبات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-kian-gold">
                    {requestsByTableArr.length > 0 ? `${requestsByTableArr[0].table} (${requestsByTableArr[0].count} طلب)` : "-"}
                  </div>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={requestsByTableArr}>
                      <XAxis dataKey="table" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FFA726" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="loyalty">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>أفضل العملاء</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الهاتف</TableHead>
                        <TableHead>النقاط</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCustomers.map((c, i) => (
                        <TableRow key={c.phone_number}>
                          <TableCell>{c.phone_number}</TableCell>
                          <TableCell>{c.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>توزيع المكافآت</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div>مشروب مجاني: <span className="font-bold">{rewardStats.free_drink}</span></div>
                    <div>خصم 20%: <span className="font-bold">{rewardStats.special_discount}</span></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>زيارات الولاء اليومية</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={loyaltyByDayArr}>
                      <XAxis dataKey="date" tickFormatter={d => format(parseISO(d), "MM-dd")} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FFD700" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="requests">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>الطلبات لكل طاولة</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={requestsByTableArr}>
                      <XAxis dataKey="table" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FFD700" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>توزيع الطلبات حسب الحالة</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart width={250} height={250}>
                    <Pie data={Object.entries(statusStats).map(([status, count]) => ({ name: status, value: count }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {Object.entries(statusStats).map((entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>أكثر الطلبات شيوعًا</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الطلب</TableHead>
                        <TableHead>عدد المرات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topRequests.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.request}</TableCell>
                          <TableCell>{r.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>توزيع الطلبات على مدار اليوم</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={requestsByHour}>
                      <XAxis dataKey="hour" tickFormatter={h => `${h}:00`} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FFD700" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="peak">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>وقت الذروة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-kian-gold">{peak.hour}:00</div>
                  <div className="text-lg mt-2">عدد الطلبات في الذروة: <span className="font-bold">{peak.count}</span></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>توزيع الطلبات على مدار اليوم</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={requestsByHour}>
                      <XAxis dataKey="hour" tickFormatter={h => `${h}:00`} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FFD700" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-kian-gold" />
          </div>
        )}
      </div>
    </PageTransition>
  );
}
