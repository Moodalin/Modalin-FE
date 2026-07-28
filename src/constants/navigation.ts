import { LayoutDashboard, Megaphone, PackageCheck, ReceiptText } from 'lucide-react'

export const PublicNavigation = [
  { label: 'Cara kerja', href: '/#how-it-works' },
  { label: 'Koleksi', href: '/#collection' },
  { label: 'Untuk pengrajin', href: '/#makers' },
]

export const DashboardNavigation = [
  { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'orders', label: 'Pesanan', icon: PackageCheck },
  { id: 'production', label: 'Produksi', icon: Megaphone },
  { id: 'finance', label: 'Keuangan', icon: ReceiptText },
] as const
