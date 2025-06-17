import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageTransition from '@/components/PageTransition'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { supabase } from '@/lib/supabase/client'

const TABS = [
    { key: 'requests', label: 'طلبات المستخدمين' },
    { key: 'users', label: 'المستخدمين' },
]

const UsersDashboard = () => {
    // اجعل التاب الافتراضي "users"
    const [activeTab, setActiveTab] = useState('users')
    const [requests, setRequests] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [confirmUser, setConfirmUser] = useState<any | null>(null)

    // جلب الطلبات
    useEffect(() => {
        if (activeTab !== 'requests') return
        setLoading(true)
        supabase
            .from('waiter_requests')
            .select(
                'id, table_number, request, status, created_at, deleted, response_time, user_name'
            )
            .order('created_at', { ascending: false })
            .then(({ data }) => setRequests(data || []))
            .finally(() => setLoading(false))
    }, [activeTab])

    // جلب المستخدمين
    useEffect(() => {
        if (activeTab !== 'users') return
        setLoading(true)
        supabase
            .from('loyalty_visits')
            .select('id, points, point_status, last_visit, status, user_name') // removed any gift fields
            .order('last_visit', { ascending: false })
            .then(({ data }) => setUsers(data || []))
            .finally(() => setLoading(false))
    }, [activeTab])
    // بحث الطلبات
    const filteredRequests = requests.filter(
        (r) =>
            r.id?.toString().includes(search.trim()) ||
            r.user_name?.toLowerCase().includes(search.toLowerCase()) ||
            r.request?.toLowerCase().includes(search.toLowerCase()) ||
            r.table_number?.toString().includes(search)
    )

    // بحث المستخدمين
    const filteredUsers = users.filter(
        (u) =>
            u.id?.toString().includes(search) ||
            u.user_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.status?.toLowerCase().includes(search.toLowerCase()) ||
            u.phone_number?.toString().includes(search)
    )

    // ترتيب الطلبات
    const [sortBy, setSortBy] = useState('created_at')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    const sortedRequests = [...filteredRequests].sort((a, b) => {
        if (sortBy === 'created_at') {
            return sortOrder === 'asc'
                ? new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime()
                : new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
        }
        if (sortBy === 'user_name') {
            return sortOrder === 'asc'
                ? (a.user_name || '').localeCompare(b.user_name || '')
                : (b.user_name || '').localeCompare(a.user_name || '')
        }
        if (sortBy === 'table_number') {
            return sortOrder === 'asc'
                ? (a.table_number || 0) - (b.table_number || 0)
                : (b.table_number || 0) - (a.table_number || 0)
        }
        return 0
    })

    // حذف طلب
    const handleDeleteRequest = async (id: string) => {
        setLoading(true)
        await supabase.from('waiter_requests').delete().eq('id', id)
        setRequests((prev) => prev.filter((r) => r.id !== id))
        setLoading(false)
    }

    // حذف مستخدم
    // خصم نقطة من المستخدم
    const handleRemovePointClick = (u: any) => {
        if (u.points <= 0) return
        setConfirmUser(u)
    }

    const confirmRemovePoint = async () => {
        if (!confirmUser) return
        const { id, points } = confirmUser
        if (points <= 0) return
        setLoading(true)
        const newPoints = points - 1
        const { error } = await supabase
            .from('loyalty_visits')
            .update({ points: newPoints })
            .eq('id', id)
        if (!error) {
            setUsers((prev) =>
                prev.map((u) => (u.id === id ? { ...u, points: newPoints } : u))
            )
        }
        setLoading(false)
        setConfirmUser(null)
    }

    const handleDeleteUser = async (id: string) => {
        setLoading(true)
        await supabase.from('loyalty_visits').delete().eq('id', id)
        setUsers((prev) => prev.filter((u) => u.id !== id))
        setLoading(false)
    }

    // إضافة مستخدم جديد (بسيطة)
    const [newUser, setNewUser] = useState({
        user_name: '',
        points: 0,
        point_status: 'pending',
        status: 'active',
        phone_number: '',
    })
    const handleAddUser = async () => {
        if (!newUser.user_name.trim()) return
        setLoading(true)
        // phone_number is required, so we'll generate a dummy if not provided
        const userToInsert = {
            ...newUser,
            phone_number: newUser.phone_number || Date.now().toString(),
        }
        const { data } = await supabase
            .from('loyalty_visits')
            .insert([userToInsert])
            .select()
        if (data && data.length > 0) setUsers((prev) => [data[0], ...prev])
        setNewUser({
            user_name: '',
            points: 0,
            point_status: 'pending',
            status: 'active',
            phone_number: '',
        })
        setLoading(false)
    }

    return (
        <PageTransition>
            <div className='w-full max-w-5xl mx-auto mt-10 p-4'>
                <h1 className='text-3xl font-bold mb-6 text-center text-kian-burgundy dark:text-gold'>
                    لوحة المستخدمين
                </h1>
                <div className='flex gap-2 justify-center mb-6'>
                    {TABS.map((tab) => (
                        <Button
                            key={tab.key}
                            variant={
                                activeTab === tab.key ? 'default' : 'outline'
                            }
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>
                <div className='mb-4 flex gap-2 items-center justify-center'>
                    <label>ترتيب حسب:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className='border rounded px-2 py-1'
                    >
                        <option value='created_at'>تاريخ الإنشاء</option>
                        <option value='user_name'>اسم المستخدم</option>
                        <option value='table_number'>رقم الطاولة</option>
                    </select>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className='border rounded px-2 py-1'
                    >
                        <option value='desc'>تنازلي</option>
                        <option value='asc'>تصاعدي</option>
                    </select>
                    <Input
                        placeholder='بحث بالاسم أو الرقم...'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='w-64'
                    />
                </div>
                {activeTab === 'requests' && (
                    <div className='overflow-x-auto'>
                        <table className='min-w-full border text-center bg-white dark:bg-kian-charcoal rounded-xl'>
                            <thead>
                                <tr className='bg-kian-sand dark:bg-kian-burgundy'>
                                    <th className='p-2'>#</th>
                                    <th className='p-2'>ID</th>
                                    <th className='p-2'>رقم الطاولة</th>
                                    <th className='p-2'>الطلب</th>
                                    <th className='p-2'>الحالة</th>
                                    <th className='p-2'>تاريخ الإنشاء</th>
                                    <th className='p-2'>اسم المستخدم</th>
                                    <th className='p-2'>حذف</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRequests.map((r, i) => (
                                    <tr key={r.id} className='border-b'>
                                        <td className='p-2'>{i + 1}</td>
                                        <td className='p-2'>{r.id}</td>
                                        <td className='p-2'>
                                            {r.table_number}
                                        </td>
                                        <td className='p-2'>{r.request}</td>
                                        <td className='p-2'>{r.status}</td>
                                        <td className='p-2'>
                                            {r.created_at
                                                ?.slice(0, 16)
                                                .replace('T', ' ')}
                                        </td>
                                        <td className='p-2'>{r.user_name}</td>
                                        <td className='p-2'>
                                            <Button
                                                size='sm'
                                                variant='destructive'
                                                onClick={() =>
                                                    handleDeleteRequest(r.id)
                                                }
                                            >
                                                حذف
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'users' && (
                    <div>
                        <div className='mb-4 flex gap-2 items-center justify-center'>
                            <Input
                                placeholder='اسم المستخدم الجديد'
                                value={newUser.user_name}
                                onChange={(e) =>
                                    setNewUser((u) => ({
                                        ...u,
                                        user_name: e.target.value,
                                    }))
                                }
                                className='w-48'
                            />
                            <Input
                                placeholder='رقم الهاتف (اختياري)'
                                value={newUser.phone_number}
                                onChange={(e) =>
                                    setNewUser((u) => ({
                                        ...u,
                                        phone_number: e.target.value,
                                    }))
                                }
                                className='w-48'
                            />
                            <Input
                                placeholder='النقاط'
                                type='number'
                                value={newUser.points}
                                onChange={(e) =>
                                    setNewUser((u) => ({
                                        ...u,
                                        points: Number(e.target.value),
                                    }))
                                }
                                className='w-32'
                            />
                            <Button
                                onClick={handleAddUser}
                                disabled={loading || !newUser.user_name.trim()}
                                className='bg-green-600 text-white'
                            >
                                إضافة مستخدم
                            </Button>
                        </div>
                        <div className='overflow-x-auto'>
                            <table className='min-w-full border text-center bg-white dark:bg-kian-charcoal rounded-xl'>
                                <thead>
                                    <tr className='bg-kian-sand dark:bg-kian-burgundy'>
                                        <th className='p-2'>#</th>
                                        <th className='p-2'>ID</th>
                                        <th className='p-2'>اسم المستخدم</th>
                                        <th className='p-2'>رقم الهاتف</th>
                                        <th className='p-2'>النقاط</th>
                                        <th className='p-2'>حالة النقاط</th>
                                        <th className='p-2'>آخر زيارة</th>
                                        <th className='p-2'>الحالة</th>
                                        <th className='p-2'>حذف</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u, i) => (
                                        <tr key={u.id} className='border-b'>
                                            <td className='p-2'>{i + 1}</td>
                                            <td className='p-2'>{u.id}</td>
                                            <td className='p-2'>
                                                {u.user_name}
                                            </td>
                                            <td className='p-2'>
                                                {u.phone_number}
                                            </td>
                                            <td className='p-2'>{u.points}</td>
                                            <td className='p-2'>
                                                <Button
                                                    size='sm'
                                                    variant='outline'
                                                    disabled={
                                                        u.points <= 0 || loading
                                                    }
                                                    onClick={() =>
                                                        handleRemovePointClick(
                                                            u
                                                        )
                                                    }
                                                >
                                                    خصم
                                                </Button>
                                            </td>
                                            <td className='p-2'>
                                                {u.point_status}
                                            </td>
                                            <td className='p-2'>
                                                {u.last_visit
                                                    ?.slice(0, 16)
                                                    .replace('T', ' ')}
                                            </td>
                                            <td className='p-2'>{u.status}</td>
                                            <td className='p-2'>
                                                <Button
                                                    size='sm'
                                                    variant='destructive'
                                                    onClick={() =>
                                                        handleDeleteUser(u.id)
                                                    }
                                                >
                                                    حذف
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            {/* حوار تأكيد خصم نقطة */}
            <AlertDialog
                open={!!confirmUser}
                onOpenChange={(open) => !open && setConfirmUser(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد حذف نقطة</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم خصم نقطة من "{confirmUser?.user_name}". هل أنت
                            متأكد؟
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className=' m-[10px]'>
                            إلغاء
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemovePoint}>
                            تأكيد
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageTransition>
    )
}

export default UsersDashboard
