type VerificationStatus = 'idle' | 'loading' | 'success' | 'error'

interface Item {
    id: number
    name_ar: string
    name_en: string
    price: number
    points: number
    image_url?: string
    description_ar?: string
    description_en?: string
    category_id: number
}

interface InvoiceItem {
    name: string
    quantity: number
    type: 'cash' | 'loyalty'
    price: number
    points: number | null
}
