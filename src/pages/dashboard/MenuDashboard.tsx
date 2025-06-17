import React, { useEffect, useState } from 'react'
import PageTransition from '@/components/PageTransition'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'

const MenuDashboard = () => {
    const navigate = useNavigate()
    // حالة التصنيفات
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [showAdd, setShowAdd] = useState(false)
    const [newCat, setNewCat] = useState({ name_ar: '', name_en: '' })

    // حالة المنتجات
    const [items, setItems] = useState<any[]>([])
    const [showAddItem, setShowAddItem] = useState(false)
    const [newItem, setNewItem] = useState({
        name_ar: '',
        name_en: '',
        price: '',
        points: '',
        category_id: '',
        image_url: '',
        description_ar: '',
        description_en: '',
    })

    // جلب التصنيفات (distinct من جدول items)
    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('categories')
                .select('id, name_ar, name_en')
                .order('created_at', { ascending: false })
            if (!error && data) {
                setCategories(data)
            }
            setLoading(false)
        }
        fetchCategories()
    }, [])

    // إضافة تصنيف جديد
    const handleAddCategory = async () => {
        if (!newCat.name_ar.trim() || !newCat.name_en.trim()) {
            toast({
                title: 'خطأ',
                description: 'يجب إدخال اسم التصنيف بالعربي والانجليزي',
                variant: 'destructive',
            })
            return
        }
        setLoading(true)
        const { data, error } = await supabase
            .from('categories')
            .insert([newCat])
            .select()
        if (!error && data && data.length > 0) {
            setCategories([{ ...data[0] }, ...categories])
            setShowAdd(false)
            setNewCat({ name_ar: '', name_en: '' })
            toast({
                title: 'تمت الإضافة',
                description: 'تم إضافة التصنيف بنجاح',
            })
        } else {
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء الإضافة',
                variant: 'destructive',
            })
        }
        setLoading(false)
    }

    // تعديل تصنيف
    const [editCatId, setEditCatId] = useState<string | null>(null)
    const [editCat, setEditCat] = useState({ name_ar: '', name_en: '' })
    const handleEditCategory = (cat: any) => {
        setEditCatId(cat.id)
        setEditCat({ name_ar: cat.name_ar, name_en: cat.name_en })
    }
    const handleSaveEditCategory = async () => {
        if (!editCat.name_ar.trim() || !editCat.name_en.trim()) {
            toast({
                title: 'خطأ',
                description: 'يجب إدخال اسم التصنيف بالعربي والانجليزي',
                variant: 'destructive',
            })
            return
        }
        setLoading(true)
        const { error } = await supabase
            .from('categories')
            .update(editCat)
            .eq('id', editCatId!)
        if (!error) {
            setCategories(
                categories.map((cat) =>
                    cat.id === editCatId ? { ...cat, ...editCat } : cat
                )
            )
            setEditCatId(null)
            toast({
                title: 'تم التعديل',
                description: 'تم تعديل التصنيف بنجاح',
            })
        } else {
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء التعديل',
                variant: 'destructive',
            })
        }
        setLoading(false)
    }

    // حذف تصنيف
    const handleDeleteCategory = async (id: string) => {
        setLoading(true)
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)
        if (!error) {
            setCategories(categories.filter((cat) => cat.id !== id))
            toast({ title: 'تم الحذف', description: 'تم حذف التصنيف بنجاح' })
        } else {
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء الحذف',
                variant: 'destructive',
            })
        }
        setLoading(false)
    }

    // جلب المنتجات
    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('items')
                .select('*, categories:category_id(name_ar, name_en)')
                .order('created_at', { ascending: false })
            if (!error) setItems(data || [])
            setLoading(false)
        }
        fetchItems()
    }, [])

    // إضافة منتج جديد
    const handleAddItem = async () => {
        if (
            !newItem.name_ar.trim() ||
            !newItem.name_en.trim() ||
            !newItem.price ||
            !newItem.category_id
        ) {
            toast({
                title: 'خطأ',
                description: 'يجب إدخال كل البيانات المطلوبة (اسم، سعر، تصنيف)',
                variant: 'destructive',
            })
            return
        }
        setLoading(true)
        const { error } = await supabase.from('items').insert([
            {
                ...newItem,
                price: Number(newItem.price),
                points: Number(newItem.points) || 0,
                category_id: Number(newItem.category_id),
            },
        ])
        if (!error) {
            setShowAddItem(false)
            setNewItem({
                name_ar: '',
                name_en: '',
                price: '',
                points: '',
                category_id: '',
                image_url: '',
                description_ar: '',
                description_en: '',
            })
            toast({
                title: 'تمت الإضافة',
                description: 'تم إضافة المنتج بنجاح',
            })
            // إعادة تحميل المنتجات
            const { data } = await supabase
                .from('items')
                .select('*, categories:category_id(name_ar, name_en)')
                .order('created_at', { ascending: false })
            setItems(data || [])
        } else {
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء الإضافة',
                variant: 'destructive',
            })
        }
        setLoading(false)
    }

    // تعديل منتج
    const [editItemId, setEditItemId] = useState<string | null>(null)
    const [editItem, setEditItem] = useState<any>(null)
    const handleEditItem = (item: any) => {
        setEditItemId(item.id)
        setEditItem({ ...item })
    }
    const handleSaveEditItem = async () => {
        if (
            !editItem.name_ar.trim() ||
            !editItem.name_en.trim() ||
            !editItem.price ||
            !editItem.category_id
        ) {
            toast({
                title: 'خطأ',
                description: 'يجب إدخال كل البيانات المطلوبة (اسم، سعر، تصنيف)',
                variant: 'destructive',
            })
            return
        }
        setLoading(true)
        const { error } = await supabase
            .from('items')
            .update({
                ...editItem,
                price: Number(editItem.price),
                points: Number(editItem.points) || 0,
                category_id: Number(editItem.category_id),
            })
            .eq('id', editItemId!)
        if (!error) {
            setItems(
                items.map((item) =>
                    item.id === editItemId ? { ...item, ...editItem } : item
                )
            )
            setEditItemId(null)
            toast({ title: 'تم التعديل', description: 'تم تعديل المنتج بنجاح' })
        } else {
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء التعديل',
                variant: 'destructive',
            })
        }
        setLoading(false)
    }

    // حذف منتج
    const handleDeleteItem = async (id: string) => {
        setLoading(true)
        const { error } = await supabase.from('items').delete().eq('id', id)
        if (!error) {
            setItems(items.filter((item) => item.id !== id))
            toast({ title: 'تم الحذف', description: 'تم حذف المنتج بنجاح' })
        } else {
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء الحذف',
                variant: 'destructive',
            })
        }
        setLoading(false)
    }

    return (
        <PageTransition>
            <div className='w-full max-w-5xl mx-auto mt-10 p-4'>
                <h1 className='text-3xl font-bold mb-6 text-center text-kian-burgundy dark:text-gold'>
                    التصنيفات / Categories
                </h1>
                <div className='flex justify-end mb-6'>
                    <Button
                        onClick={() => setShowAdd(true)}
                        className='bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-full'
                    >
                        + إضافة تصنيف
                    </Button>
                </div>
                {showAdd && (
                    <div className='fixed inset-0 flex items-center justify-center z-50 bg-black/50'>
                        <div
                            className='bg-white dark:bg-kian-charcoal rounded-2xl shadow-2xl p-8 w-full max-w-xs flex flex-col gap-4 relative animate-fade-in'
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className='absolute top-2 left-2 text-gray-400 hover:text-red-500 text-xl font-bold focus:outline-none'
                                onClick={() => setShowAdd(false)}
                                aria-label='إغلاق'
                            >
                                ×
                            </button>
                            <h2 className='text-lg font-bold text-center text-kian-burgundy dark:text-gold mb-2'>
                                إضافة تصنيف جديد
                            </h2>
                            <Input
                                placeholder='اسم التصنيف بالعربي'
                                value={newCat.name_ar}
                                onChange={(e) =>
                                    setNewCat((c) => ({
                                        ...c,
                                        name_ar: e.target.value,
                                    }))
                                }
                                className='mb-2'
                            />
                            <Input
                                placeholder='اسم التصنيف بالانجليزي'
                                value={newCat.name_en}
                                onChange={(e) =>
                                    setNewCat((c) => ({
                                        ...c,
                                        name_en: e.target.value,
                                    }))
                                }
                                className='mb-2'
                            />
                            <div className='flex gap-2 mt-2 justify-center'>
                                <Button
                                    onClick={handleAddCategory}
                                    disabled={loading}
                                    className='bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-full'
                                >
                                    حفظ
                                </Button>
                                <Button
                                    variant='outline'
                                    onClick={() => setShowAdd(false)}
                                    className='px-4 py-2 rounded-full'
                                >
                                    إلغاء
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Cards View for Categories */}
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
                    {categories.length === 0 ? (
                        <div className='col-span-full text-center text-gray-400 py-10 text-lg'>
                            لا توجد تصنيفات بعد
                        </div>
                    ) : (
                        categories.map((cat, idx) => {
                            // ألوان ثابتة أو متغيرة حسب الفهرس
                            const colors = [
                                'bg-red-400',
                                'bg-pink-400',
                                'bg-yellow-400',
                                'bg-orange-400',
                                'bg-blue-500',
                                'bg-green-400',
                                'bg-purple-400',
                                'bg-fuchsia-400',
                                'bg-cyan-400',
                                'bg-lime-400',
                            ]
                            const color = colors[idx % colors.length]
                            return (
                                <Card
                                    key={cat.id}
                                    className={`flex flex-col items-center justify-between p-6 shadow-lg hover:shadow-2xl transition cursor-pointer group relative border-2 border-gold/30 hover:border-gold/80 text-black dark:text-white ${color}`}
                                    onClick={() =>
                                        navigate(
                                            `/menu-dashboard/category/${cat.id}`
                                        )
                                    }
                                >
                                    <div className='w-full flex flex-col items-center gap-2'>
                                        <div className='text-2xl font-bold text-black dark:text-white mb-2'>
                                            {cat.name_ar}
                                        </div>
                                        <div className='text-base text-gray-800 dark:text-yellow-200 mb-2'>
                                            {cat.name_en}
                                        </div>
                                    </div>
                                    <div
                                        className='absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition pointer-events-auto z-10'
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Button
                                            size='icon'
                                            variant='outline'
                                            className='rounded-full p-2'
                                            onClick={() => {
                                                handleEditCategory(cat)
                                            }}
                                        >
                                            <Pencil className='w-4 h-4' />
                                        </Button>
                                        <Button
                                            size='icon'
                                            variant='destructive'
                                            className='rounded-full p-2'
                                            onClick={() =>
                                                handleDeleteCategory(cat.id)
                                            }
                                        >
                                            <Trash2 className='w-4 h-4' />
                                        </Button>
                                    </div>
                                    {editCatId === cat.id && (
                                        <div className='fixed inset-0 flex items-center justify-center z-50 bg-black/50'>
                                            <div
                                                className='bg-white dark:bg-kian-charcoal rounded-2xl shadow-2xl p-8 w-full max-w-xs flex flex-col gap-4 relative animate-fade-in'
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <button
                                                    className='absolute top-2 left-2 text-gray-400 hover:text-red-500 text-xl font-bold focus:outline-none'
                                                    onClick={() =>
                                                        setEditCatId(null)
                                                    }
                                                    aria-label='إغلاق'
                                                ></button>
                                                <h2 className='text-lg font-bold text-center text-kian-burgundy dark:text-gold mb-2'>
                                                    تعديل التصنيف
                                                </h2>
                                                <Input
                                                    value={editCat.name_ar}
                                                    onChange={(e) =>
                                                        setEditCat((c) => ({
                                                            ...c,
                                                            name_ar:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    placeholder='اسم التصنيف بالعربي'
                                                    className='mb-2'
                                                />
                                                <Input
                                                    value={editCat.name_en}
                                                    onChange={(e) =>
                                                        setEditCat((c) => ({
                                                            ...c,
                                                            name_en:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    placeholder='اسم التصنيف بالانجليزي'
                                                    className='mb-2'
                                                />
                                                <div className='flex gap-2 mt-2 justify-center'>
                                                    <Button
                                                        size='sm'
                                                        className='bg-blue-600 text-white'
                                                        onClick={
                                                            handleSaveEditCategory
                                                        }
                                                        disabled={loading}
                                                    >
                                                        حفظ
                                                    </Button>
                                                    <Button
                                                        size='sm'
                                                        variant='outline'
                                                        onClick={() =>
                                                            setEditCatId(null)
                                                        }
                                                    >
                                                        إلغاء
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            )
                        })
                    )}
                </div>
            </div>
        </PageTransition>
    )
}

export default MenuDashboard
