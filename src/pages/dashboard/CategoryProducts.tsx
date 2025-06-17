import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import PageTransition from '@/components/PageTransition'
import { Pencil, Trash2, ArrowLeft } from 'lucide-react'

const CategoryProducts = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [category, setCategory] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [showAdd, setShowAdd] = useState(false)
    const [newItem, setNewItem] = useState({
        name_ar: '',
        name_en: '',
        price: '',
        points: '',
        image_url: '',
        description_ar: '',
        description_en: '',
    })
    const [editItemId, setEditItemId] = useState<string | null>(null)
    const [editItem, setEditItem] = useState<any>(null)

    // جلب بيانات التصنيف
    useEffect(() => {
        const fetchCategory = async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('id', id)
                .single()
            if (!error) setCategory(data)
        }
        fetchCategory()
    }, [id])

    // جلب المنتجات الخاصة بالتصنيف
    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('category_id', id)
                .order('created_at', { ascending: false })
            if (!error) setItems(data || [])
            setLoading(false)
        }
        fetchItems()
    }, [id])

    // إضافة منتج جديد
    const handleAddItem = async () => {
        if (
            !newItem.name_ar.trim() ||
            !newItem.name_en.trim() ||
            !newItem.price
        ) {
            toast({
                title: 'خطأ',
                description: 'يجب إدخال كل البيانات المطلوبة (اسم، سعر)',
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
                category_id: Number(id),
            },
        ])
        if (!error) {
            setShowAdd(false)
            setNewItem({
                name_ar: '',
                name_en: '',
                price: '',
                points: '',
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
                .select('*')
                .eq('category_id', id)
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
    const handleEditItem = (item: any) => {
        setEditItemId(item.id)
        setEditItem({ ...item })
    }
    const handleSaveEditItem = async () => {
        if (
            !editItem.name_ar.trim() ||
            !editItem.name_en.trim() ||
            !editItem.price
        ) {
            toast({
                title: 'خطأ',
                description: 'يجب إدخال كل البيانات المطلوبة (اسم، سعر)',
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
                category_id: Number(id),
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
    const handleDeleteItem = async (itemId: string) => {
        setLoading(true)
        const { error } = await supabase.from('items').delete().eq('id', itemId)
        if (!error) {
            setItems(items.filter((item) => item.id !== itemId))
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
            <div className='w-full max-w-4xl mx-auto mt-10 p-4'>
                <div className='flex items-center gap-4 mb-6'>
                    <Button variant='outline' onClick={() => navigate(-1)}>
                        <ArrowLeft className='w-5 h-5 mr-1' />
                        رجوع
                    </Button>
                    <h1 className='text-2xl font-bold text-kian-burgundy dark:text-gold'>
                        {category
                            ? `${category.name_ar} / ${category.name_en}`
                            : '...'}
                    </h1>
                </div>
                <div className='flex justify-end mb-6'>
                    <Button
                        onClick={() => setShowAdd(true)}
                        className='bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-full'
                    >
                        + إضافة منتج
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
                                إضافة منتج جديد
                            </h2>
                            <Input
                                placeholder='اسم المنتج بالعربي'
                                value={newItem.name_ar}
                                onChange={(e) =>
                                    setNewItem((i) => ({
                                        ...i,
                                        name_ar: e.target.value,
                                    }))
                                }
                                className='mb-2'
                            />
                            <Input
                                placeholder='اسم المنتج بالانجليزي'
                                value={newItem.name_en}
                                onChange={(e) =>
                                    setNewItem((i) => ({
                                        ...i,
                                        name_en: e.target.value,
                                    }))
                                }
                                className='mb-2'
                            />
                            <Input
                                placeholder='السعر'
                                type='number'
                                value={newItem.price}
                                onChange={(e) =>
                                    setNewItem((i) => ({
                                        ...i,
                                        price: e.target.value,
                                    }))
                                }
                                className='mb-2'
                            />
                            <Input
                                placeholder='النقاط (اختياري)'
                                type='number'
                                value={newItem.points}
                                onChange={(e) =>
                                    setNewItem((i) => ({
                                        ...i,
                                        points: e.target.value,
                                    }))
                                }
                                className='mb-2'
                            />
                            <Input
                                placeholder='رابط الصورة (اختياري)'
                                value={newItem.image_url}
                                onChange={(e) =>
                                    setNewItem((i) => ({
                                        ...i,
                                        image_url: e.target.value,
                                    }))
                                }
                                className='mb-2'
                            />
                            <Input
                                placeholder='وصف بالعربي (اختياري)'
                                value={newItem.description_ar}
                                onChange={(e) =>
                                    setNewItem((i) => ({
                                        ...i,
                                        description_ar: e.target.value,
                                    }))
                                }
                                className='mb-2'
                            />
                            <Input
                                placeholder='وصف بالانجليزي (اختياري)'
                                value={newItem.description_en}
                                onChange={(e) =>
                                    setNewItem((i) => ({
                                        ...i,
                                        description_en: e.target.value,
                                    }))
                                }
                                className='mb-2'
                            />
                            <div className='flex gap-2 mt-2 justify-center'>
                                <Button
                                    onClick={handleAddItem}
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
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                    {items.length === 0 ? (
                        <div className='col-span-full text-center text-gray-400 py-10 text-lg'>
                            لا توجد منتجات بعد
                        </div>
                    ) : (
                        items.map((item) => (
                            <Card
                                key={item.id}
                                className='flex flex-col items-center justify-between p-6 shadow-lg hover:shadow-2xl transition group relative border-2 border-gold/30 hover:border-gold/80 bg-white dark:bg-kian-charcoal'
                            >
                                <div className='w-full flex flex-col items-center gap-2'>
                                    <div className='text-xl font-bold text-kian-burgundy dark:text-gold mb-1'>
                                        {item.name_ar}
                                    </div>
                                    <div className='text-base text-gray-500 dark:text-yellow-200 mb-1'>
                                        {item.name_en}
                                    </div>
                                    <div className='text-lg font-bold text-green-700 dark:text-green-300 mb-1'>
                                        {item.price} EGP
                                    </div>
                                    {item.image_url && (
                                        <img
                                            src={item.image_url}
                                            alt='img'
                                            className='w-16 h-16 object-cover rounded mb-2'
                                        />
                                    )}
                                    <div className='text-xs text-gray-400'>
                                        {item.description_ar ||
                                            item.description_en}
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
                                        onClick={() => handleEditItem(item)}
                                    >
                                        <Pencil className='w-4 h-4' />
                                    </Button>
                                    <Button
                                        size='icon'
                                        variant='destructive'
                                        className='rounded-full p-2'
                                        onClick={() =>
                                            handleDeleteItem(item.id)
                                        }
                                    >
                                        <Trash2 className='w-4 h-4' />
                                    </Button>
                                </div>
                                {editItemId === item.id && (
                                    <div className='fixed inset-0 flex items-center justify-center z-50 bg-black/50'>
                                        <div
                                            className='bg-white dark:bg-kian-charcoal rounded-2xl shadow-2xl p-8 w-full max-w-xs flex flex-col gap-4 relative animate-fade-in'
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                className='absolute top-2 left-2 text-gray-400 hover:text-red-500 text-xl font-bold focus:outline-none'
                                                onClick={() =>
                                                    setEditItemId(null)
                                                }
                                                aria-label='إغلاق'
                                            >
                                                ×
                                            </button>
                                            <h2 className='text-lg font-bold text-center text-kian-burgundy dark:text-gold mb-2'>
                                                تعديل المنتج
                                            </h2>
                                            <Input
                                                value={editItem.name_ar}
                                                onChange={(e) =>
                                                    setEditItem((i: any) => ({
                                                        ...i,
                                                        name_ar: e.target.value,
                                                    }))
                                                }
                                                placeholder='اسم المنتج بالعربي'
                                                className='mb-2'
                                            />
                                            <Input
                                                value={editItem.name_en}
                                                onChange={(e) =>
                                                    setEditItem((i: any) => ({
                                                        ...i,
                                                        name_en: e.target.value,
                                                    }))
                                                }
                                                placeholder='اسم المنتج بالانجليزي'
                                                className='mb-2'
                                            />
                                            <Input
                                                value={editItem.price}
                                                type='number'
                                                onChange={(e) =>
                                                    setEditItem((i: any) => ({
                                                        ...i,
                                                        price: e.target.value,
                                                    }))
                                                }
                                                placeholder='السعر'
                                                className='mb-2'
                                            />
                                            <Input
                                                value={editItem.points}
                                                type='number'
                                                onChange={(e) =>
                                                    setEditItem((i: any) => ({
                                                        ...i,
                                                        points: e.target.value,
                                                    }))
                                                }
                                                placeholder='النقاط (اختياري)'
                                                className='mb-2'
                                            />
                                            <Input
                                                value={editItem.image_url}
                                                onChange={(e) =>
                                                    setEditItem((i: any) => ({
                                                        ...i,
                                                        image_url:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder='رابط الصورة (اختياري)'
                                                className='mb-2'
                                            />
                                            <Input
                                                value={editItem.description_ar}
                                                onChange={(e) =>
                                                    setEditItem((i: any) => ({
                                                        ...i,
                                                        description_ar:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder='وصف بالعربي (اختياري)'
                                                className='mb-2'
                                            />
                                            <Input
                                                value={editItem.description_en}
                                                onChange={(e) =>
                                                    setEditItem((i: any) => ({
                                                        ...i,
                                                        description_en:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder='وصف بالانجليزي (اختياري)'
                                                className='mb-2'
                                            />
                                            <div className='flex gap-2 mt-2 justify-center'>
                                                <Button
                                                    size='sm'
                                                    className='bg-blue-600 text-white'
                                                    onClick={handleSaveEditItem}
                                                    disabled={loading}
                                                >
                                                    حفظ
                                                </Button>
                                                <Button
                                                    size='sm'
                                                    variant='outline'
                                                    onClick={() =>
                                                        setEditItemId(null)
                                                    }
                                                >
                                                    إلغاء
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </PageTransition>
    )
}

export default CategoryProducts
