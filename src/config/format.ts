export function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompactRupiah(value: number) {
  if (value >= 1_000_000) return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: value % 1_000_000 === 0 ? 0 : 1 }).format(value)
  return formatRupiah(value)
}
