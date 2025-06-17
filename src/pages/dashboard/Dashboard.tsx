import { useEffect, useState, useRef, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageTransition from '@/components/PageTransition'
import { toast } from '@/components/ui/use-toast'
import { useLanguage } from '@/contexts/useLanguage'
import ThemeLanguageToggle from '@/components/ThemeLanguageToggle'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from '@hello-pangea/dnd'
import { useLoading } from '@/contexts/useLoading'
import { useAuth } from '@/contexts/useAuth'

interface WaiterRequest {
    id: string
    table_number: number
    request: string | null
    status: string
    created_at: string
    phone_number: string | null
    deleted: boolean
    finished_at?: string
    user_name?: string
    user_id: string
}

interface LoyaltyInfo {
    phone_number: string
    points: number
    status: string | null
    point_status: 'approved' | 'pending' | 'rejected' | null
    // Removed gift and got_the_gift fields
}

// مكون مؤقت لعداد الوقت
const RequestTimer = ({
    createdAt,
    status,
    finishedAt,
}: {
    createdAt: string
    status: string
    finishedAt?: string
}) => {
    const [seconds, setSeconds] = useState<number | null>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    useEffect(() => {
        const getElapsedSeconds = () => {
            if (status === 'completed' && finishedAt) {
                const created = new Date(createdAt).getTime()
                const finished = new Date(finishedAt).getTime()
                return Math.floor((finished - created) / 1000)
            }
            if (status === 'completed') return null
            const created = new Date(createdAt).getTime()
            const now = Date.now()
            return Math.floor((now - created) / 1000)
        }
        setSeconds(getElapsedSeconds())
        if (status !== 'completed') {
            intervalRef.current = setInterval(
                () => setSeconds(getElapsedSeconds()),
                1000
            )
            return () =>
                intervalRef.current && clearInterval(intervalRef.current)
        }
    }, [createdAt, status, finishedAt])
    if (seconds == null) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return (
        <span className='ml-2 flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-50 dark:from-yellow-900 dark:via-yellow-800 dark:to-yellow-700 shadow-sm border border-yellow-300 dark:border-yellow-800'>
            <svg
                className='w-4 h-4 text-yellow-600 dark:text-yellow-300'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
            >
                <circle cx='12' cy='12' r='10' />
                <path d='M12 6v6l4 2' />
            </svg>
            {mins}:{secs.toString().padStart(2, '0')} {mins > 0 ? 'min' : 'sec'}
            {status === 'completed' && (
                <span className='ml-1 text-green-600 dark:text-green-300 font-bold'>
                    ✓
                </span>
            )}
        </span>
    )
}

// مكون بطاقة الطلب (قابل لإعادة الاستخدام)
const RequestCard = ({
    request,
    loyaltyInfo,
    t,
    formatDate,
    onMarkAsCompleted,
    onMarkAsPending,
    onMarkAsNew,
    onDelete,
    colKey,
}: {
    request: WaiterRequest
    loyaltyInfo: Record<string, LoyaltyInfo>
    t: any
    formatDate: (date: string) => string
    onMarkAsCompleted: (id: string) => void
    onMarkAsPending: (id: string) => void
    onMarkAsNew: (id: string) => void
    onDelete: (id: string) => void
    colKey: string
}) => (
    <div className='bg-kian-sand dark:bg-kian-charcoal rounded-lg shadow p-3 sm:p-4 border border-kian-burgundy dark:border-kian-sand'>
        <div className='flex justify-between items-center mb-2'>
            <div className='flex items-center gap-2'>
                <span className='inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-200 to-yellow-100 text-yellow-900 font-bold shadow-sm border border-yellow-400 dark:from-yellow-900 dark:via-yellow-800 dark:to-yellow-700 dark:text-yellow-100 dark:border-yellow-700'>
                    {request.table_number}
                </span>
                <span className='font-semibold text-sm sm:text-base text-kian-burgundy dark:text-yellow-200 tracking-wide'>
                    {t('tableColumn')}
                </span>
            </div>
            <span className='text-xs text-gray-500 flex items-center gap-2'>
                {formatDate(request.created_at)}
                <RequestTimer
                    createdAt={request.created_at}
                    status={request.status}
                    finishedAt={request.finished_at}
                />
            </span>
        </div>
        <div className='mb-2 flex items-center gap-2'>
            <span className='font-semibold text-kian-charcoal dark:text-yellow-100 text-sm'>
                {t('requestColumn')}:
            </span>
            <span className='text-sm sm:text-[15px] font-medium text-kian-burgundy dark:text-yellow-200'>
                {request.request || t('noSpecificRequest')}
            </span>
        </div>
        <div className='mb-2 flex items-center gap-2'>
            <span className='font-semibold text-kian-charcoal dark:text-yellow-100 text-sm'>
                {t('phoneNumber')}:
            </span>
            <span className='text-sm sm:text-[15px] font-medium text-kian-burgundy dark:text-yellow-200'>
                {request.phone_number || '-'}
            </span>
        </div>
        <div className='mb-2 flex items-center gap-2'>
            <span className='font-semibold text-kian-charcoal dark:text-yellow-100 text-sm'>
                {t('userName')}: {request.user_name || '-'}
            </span>
        </div>
        <div className='mb-2 flex items-center gap-2'>
            <span className='font-semibold text-kian-charcoal dark:text-yellow-100 text-sm'>
                {t('points')}:
            </span>
            <span className='inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-br from-green-200 via-green-100 to-green-50 text-green-900 font-bold text-xs shadow border border-green-300 dark:from-green-900 dark:via-green-800 dark:to-green-700 dark:text-green-100 dark:border-green-700'>
                {request.user_id &&
                loyaltyInfo[request.user_id]?.points !== undefined
                    ? loyaltyInfo[request.user_id]?.points
                    : '-'}
            </span>
        </div>
        <div className='flex flex-wrap gap-2 mt-3 justify-center'>
            {colKey === 'pending' && (
                <>
                    <Button
                        variant='outline'
                        size='sm'
                        className='bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/40 px-2 py-0 h-7 rounded-full font-bold text-xs shadow border border-blue-300 dark:border-blue-700'
                        onClick={() => onMarkAsNew(request.id)}
                    >
                        إعادة كجديد
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        className='bg-green-400 text-green-900 border-green-200 hover:bg-green-500 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/40 px-2 py-0 h-7 rounded-full font-bold text-xs shadow border border-green-300 dark:border-green-700'
                        onClick={() => onMarkAsCompleted(request.id)}
                    >
                        {t('markComplete')}
                    </Button>
                </>
            )}
            {colKey === 'new' && (
                <Button
                    variant='outline'
                    size='sm'
                    className='bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/40 px-2 py-0 h-7 rounded-full font-bold text-xs shadow border border-yellow-300 dark:border-yellow-700'
                    onClick={() => onMarkAsPending(request.id)}
                >
                    {t('markPending')}
                </Button>
            )}
            {colKey === 'completed' && (
                <>
                    <Button
                        variant='outline'
                        size='sm'
                        className='bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/40 px-2 py-0 h-7 rounded-full font-bold text-xs shadow border border-blue-300 dark:border-blue-700'
                        onClick={() => onMarkAsNew(request.id)}
                    >
                        إعادة كجديد
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        className='bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/40 px-2 py-0 h-7 rounded-full font-bold text-xs shadow border border-yellow-300 dark:border-yellow-700'
                        onClick={() => onMarkAsPending(request.id)}
                    >
                        {t('markPending')}
                    </Button>
                </>
            )}
            <Button
                variant='outline'
                size='sm'
                className='bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40 px-2 py-0 h-7 rounded-full font-bold text-xs shadow border border-red-300 dark:border-red-700'
                onClick={() => onDelete(request.id)}
            >
                {t('delete') || 'حذف'}
            </Button>
        </div>
    </div>
)

// مكون عمود الكنبان (قابل لإعادة الاستخدام)
const KanbanColumn = ({
    col,
    requests,
    children,
}: {
    col: { key: string; title: string }
    requests: WaiterRequest[]
    children: (request: WaiterRequest, idx: number) => ReactNode
}) => {
    let headerColor = ''
    if (col.key === 'new')
        headerColor = 'bg-red-100 text-red-700 border border-red-300'
    else if (col.key === 'pending')
        headerColor = 'bg-yellow-100 text-yellow-800 border border-yellow-300'
    else if (col.key === 'completed')
        headerColor = 'bg-green-100 text-green-800 border border-green-300'
    return (
        <Droppable droppableId={col.key} key={col.key}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-white dark:bg-kian-burgundy rounded-xl shadow-lg min-w-[90vw] sm:min-w-[320px] sm:w-[320px] md:min-w-[340px] md:w-[340px] p-3 sm:p-4 flex flex-col transition-all duration-200 ease-in-out border-2 border-kian-sand dark:border-kian-burgundy ${
                        snapshot.isDraggingOver ? 'ring-2 ring-gold' : ''
                    }`}
                >
                    <h2
                        className={`text-lg sm:text-xl font-semibold mb-2 sm:mb-4 text-center rounded-full px-2 sm:px-4 py-1 sm:py-2 shadow-sm ${headerColor}`}
                    >
                        {col.title}
                    </h2>
                    <div className='flex-1 space-y-3 sm:space-y-4 min-h-[40px]'>
                        {requests.map(children)}
                        {provided.placeholder}
                    </div>
                </div>
            )}
        </Droppable>
    )
}

const StaffDashboard = () => {
    const navigate = useNavigate()
    const { t, language } = useLanguage()
    const [requests, setRequests] = useState<WaiterRequest[]>([])
    const [loyaltyInfo, setLoyaltyInfo] = useState<Record<string, LoyaltyInfo>>(
        {}
    )
    const { logout } = useAuth()
    const kanbanColumns = [
        { key: 'new', title: t('newOrders') },
        { key: 'pending', title: t('pending') },
        { key: 'completed', title: t('completed') },
    ]
    const requestsByStatus: Record<string, WaiterRequest[]> = {
        new: [],
        pending: [],
        completed: [],
    }
    requests.forEach((req) => {
        if (req.status === 'completed') requestsByStatus.completed.push(req)
        else if (req.status === 'pending') requestsByStatus.pending.push(req)
        else requestsByStatus.new.push(req)
    })

    // دوال تغيير حالة الطلبات (نفس المنطق، بدون تكرار)
    const updateRequestStatus = async (
        id: string,
        status: string,
        extra: any = {}
    ) => {
        try {
            let updateObj: any = { status, ...extra }
            if (status === 'completed') {
                updateObj.finished_at = new Date().toISOString()
                const req = requests.find((r) => r.id === id)
                if (req && req.created_at) {
                    const created = new Date(req.created_at).getTime()
                    const now = Date.now()
                    updateObj.response_time = Math.floor((now - created) / 1000)
                }
            }
            const { error } = await supabase
                .from('waiter_requests')
                .update(updateObj)
                .eq('id', id)
            if (error) throw error
            setRequests((prev) =>
                prev.map((req) =>
                    req.id === id ? { ...req, ...updateObj } : req
                )
            )
            let desc = ''
            if (status === 'completed') desc = t('markedAsComplete')
            else if (status === 'pending') desc = t('markedAsPending')
            else desc = 'تمت إعادة الطلب كجديد'
            toast({
                title: t('success'),
                description: desc,
            })
        } catch (error) {
            toast({
                title: t('error'),
                description: t('failedToUpdateRequestStatus'),
                variant: 'destructive',
            })
        }
    }
    const deleteRequest = async (id: string) => {
        try {
            const { error } = await supabase
                .from('waiter_requests')
                .update({ deleted: true as any })
                .eq('id', id)
            if (error) throw error
            setRequests((prev) => prev.filter((req) => req.id !== id))
            toast({ title: t('success'), description: t('deleted') })
        } catch (error) {
            toast({
                title: t('failedToDeleteRequest'),
                description: t('failedToDeleteRequest'),
                variant: 'destructive',
            })
        }
    }
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return format(date, 'h:mm a', { locale: language === 'ar' ? ar : enUS })
    }
    // جلب الطلبات
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const { data, error } = await supabase
                    .from('waiter_requests')
                    .select('*')
                    .eq('deleted', false)
                    .order('created_at', { ascending: false })
                if (error) throw error
                if (data) {
                    const normalized = data.map((req) => ({
                        ...req,
                        user_id: req.user_id || '',
                    }))
                    setRequests(normalized as WaiterRequest[])
                    const userIds = normalized
                        .map((req) => req.user_id)
                        .filter(Boolean)
                    let loyaltyInfoObj = {}
                    if (userIds.length > 0) {
                        // جلب فقط النقاط وحالة النقاط بدون gift/got_the_gift
                        const { data: loyaltyData } = await supabase
                            .from('loyalty_visits')
                            .select('user_id, points, point_status')
                            .in('user_id', userIds)
                        if (loyaltyData && Array.isArray(loyaltyData)) {
                            loyaltyData.forEach((item) => {
                                if ('user_id' in item)
                                    loyaltyInfoObj[item.user_id] = item
                            })
                        }
                    }
                    setLoyaltyInfo(loyaltyInfoObj)
                }
            } catch (error) {
                toast({
                    title: t('error'),
                    description: t('failedToLoadRequests'),
                    variant: 'destructive',
                })
            }
        }
        fetchRequests()
        // اشتراك فوري للتحديثات
        const requestsSub = supabase
            .channel('waiter_requests_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'waiter_requests' },
                () => fetchRequests()
            )
            .subscribe()

        // اشتراك فوري لتغييرات نقاط الولاء
        const loyaltySub = supabase
            .channel('loyalty_points_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'loyalty_visits' },
                (payload) => {
                    const row = payload.new as any
                    if (row && row.user_id) {
                        setLoyaltyInfo((prev) => ({
                            ...prev,
                            [row.user_id]: { ...prev[row.user_id], ...row },
                        }))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(requestsSub)
            supabase.removeChannel(loyaltySub)
        }
    }, [t])
    useEffect(() => {}, []) // مزامنة الهدايا مع النقاط عند فتح الصفحة (لو فيه منطق إضافي)
    return (
        <PageTransition>
            <div className='w-[90%] mx-auto mt-[20px]'>
                <div className='mb-6'>
                    <ThemeLanguageToggle />
                </div>
                <div className='flex flex-col items-center mb-8 relative'>
                    <div className='flex items-center w-full justify-between'>
                        <h1 className='text-2xl md:text-3xl font-bold mb-2 flex items-center'>
                            {t('staffDashboard')}
                        </h1>
                        <div className='flex items-center gap-4'>
                            <Button
                                variant='outline'
                                className='bg-gold hover:bg-gold/90 text-black dark:bg-black dark:hover:bg-black/90 dark:text-gold'
                                onClick={() => navigate('loyalty-management')}
                            >
                                {t('generateDailyCode')}
                            </Button>
                            <Button
                                variant='outline'
                                className='bg-blue-100 hover:bg-blue-200 text-blue-900 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-gold'
                                onClick={() => navigate('reports')}
                            >
                                التقارير
                            </Button>
                            <Button
                                variant='outline'
                                className='bg-green-500 hover:bg-green-600 text-white dark:bg-green-700 dark:hover:bg-green-800 dark:text-gold font-bold'
                                onClick={() => navigate('menu')}
                            >
                                {language === 'ar' ? 'قائمة الطعام' : 'Menu'}
                            </Button>
                            <Button
                                variant='outline'
                                className='bg-purple-500 hover:bg-purple-600 text-white font-bold'
                                onClick={() => navigate('users')}
                            >
                                المستخدمين
                            </Button>
                            <Button
                                variant='outline'
                                className=' bg-red-400 text-white hover:bg-red-200'
                                onClick={logout}
                            >
                                {t('logout')}
                            </Button>
                            <div className='relative'>
                                <Bell className='h-12 w-12 text-kian-charcoal dark:text-kian-sand' />
                                {requestsByStatus['new'].length +
                                    requestsByStatus['pending'].length >
                                    0 && (
                                    <span className='absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center'>
                                        {requestsByStatus['new'].length +
                                            requestsByStatus['pending'].length}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {requests.length === 0 ? (
                    <div className='text-center py-12 px-4 text-[25px] border-2 border-dashed border-kian-sand dark:border-kian-burgundy rounded-xl'>
                        <Bell className='mx-auto h-16 w-16 text-kian-charcoal/30 dark:text-kian-sand/30 mb-4' />
                        <p className='text-base sm:text-lg text-kian-charcoal/70 dark:text-kian-sand/70'>
                            {t('noRequests')}
                        </p>
                    </div>
                ) : (
                    <DragDropContext
                        onDragEnd={({
                            source,
                            destination,
                            draggableId,
                        }: DropResult) => {
                            if (!destination) return
                            const sourceCol = source.droppableId
                            const destCol = destination.droppableId
                            if (sourceCol === destCol) return
                            setRequests((prev) =>
                                prev.map((req) =>
                                    req.id === draggableId
                                        ? { ...req, status: destCol }
                                        : req
                                )
                            )
                            if (destCol === 'completed')
                                updateRequestStatus(draggableId, 'completed')
                            else if (destCol === 'pending')
                                updateRequestStatus(draggableId, 'pending')
                            else if (destCol === 'new')
                                updateRequestStatus(draggableId, 'new')
                        }}
                    >
                        <div className='flex flex-nowrap sm:flex-wrap gap-4 sm:gap-3 md:gap-6 overflow-x-auto sm:overflow-x-visible pb-4 justify-center w-full max-w-none'>
                            {kanbanColumns.map((col) => (
                                <KanbanColumn
                                    key={col.key}
                                    col={col}
                                    requests={requestsByStatus[col.key]}
                                >
                                    {(request, idx) => (
                                        <Draggable
                                            draggableId={request.id}
                                            index={idx}
                                            key={request.id}
                                        >
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                >
                                                    <RequestCard
                                                        request={request}
                                                        loyaltyInfo={
                                                            loyaltyInfo
                                                        }
                                                        t={t}
                                                        formatDate={formatDate}
                                                        onMarkAsCompleted={(
                                                            id
                                                        ) =>
                                                            updateRequestStatus(
                                                                id,
                                                                'completed'
                                                            )
                                                        }
                                                        onMarkAsPending={(id) =>
                                                            updateRequestStatus(
                                                                id,
                                                                'pending'
                                                            )
                                                        }
                                                        onMarkAsNew={(id) =>
                                                            updateRequestStatus(
                                                                id,
                                                                'new'
                                                            )
                                                        }
                                                        onDelete={deleteRequest}
                                                        colKey={col.key}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    )}
                                </KanbanColumn>
                            ))}
                        </div>
                    </DragDropContext>
                )}
            </div>
        </PageTransition>
    )
}

export default StaffDashboard
