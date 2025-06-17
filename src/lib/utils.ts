import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
export function getStatusColor(status?: VerificationStatus): string {
    switch (status) {
        case 'success':
            return 'text-green-600'
        case 'error':
            return 'text-red-600'
        default:
            return 'text-gray-800'
    }
}

export function isTokenValidToday(token: string | null): boolean {
    if (!token) return false
    const parts = token.split('-')
    const timestamp = parts.length > 2 ? Number(parts[2]) : null
    if (!timestamp) return false
    const tokenDate = new Date(timestamp)
    const now = new Date()
    return (
        tokenDate.getFullYear() === now.getFullYear() &&
        tokenDate.getMonth() === now.getMonth() &&
        tokenDate.getDate() === now.getDate()
    )
}
