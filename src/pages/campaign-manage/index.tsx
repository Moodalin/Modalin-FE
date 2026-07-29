import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, ImagePlus, Send, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteCampaign, getManagedCampaign, publishCampaign, updateCampaignImage, updateCampaignTitle } from '@/api/campaigns/campaigns'
import { DashboardLayout } from '@/components/layout/dashboard'
import { Button, ButtonLink } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/field'
import { PageLoading } from '@/components/ui/page-loading'
import { getApiErrorMessage } from '@/config/api-error'
import { useToast } from '@/hooks/use-toast'
import type { ManagedCampaign } from '@/types/campaign'

const statusLabels: Record<string, string> = {
  DRAFT: 'Draf',
  REVIEW: 'Perlu ditinjau',
  PUBLISHED: 'Terbit',
  FUNDING: 'Pre-order dibuka',
  EXTENDED: 'Diperpanjang',
  TARGET_REACHED: 'Target tercapai',
  IN_PRODUCTION: 'Dalam produksi',
  QUALITY_CHECK: 'Pemeriksaan kualitas',
  PACKING: 'Pengemasan',
  SHIPPING: 'Pengiriman',
  COMPLETED: 'Selesai',
  FAILED: 'Target tidak tercapai',
  CANCELLED: 'Dibatalkan',
}

export default function CampaignManagePage() {
  const { campaignId = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [campaign, setCampaign] = useState<ManagedCampaign | null>(null)
  const [title, setTitle] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmingPublish, setConfirmingPublish] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    getManagedCampaign(campaignId)
      .then((data) => { if (active) { setCampaign(data); setTitle(data.title) } })
      .catch((caught) => { if (active) setError(getApiErrorMessage(caught, 'Kampanye tidak dapat dimuat.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [campaignId])

  useEffect(() => {
    if (!image) return setPreviewUrl('')
    const url = URL.createObjectURL(image)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  const selectImage = (file: File | null) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast({ message: 'Gunakan gambar JPG, PNG, atau WebP.', variant: 'error' })
    if (file.size > 10 * 1024 * 1024) return toast({ message: 'Pilih gambar di bawah 10 MB.', variant: 'error' })
    setImage(file)
  }

  const saveTitle = async () => {
    const nextTitle = title.trim()
    if (nextTitle.length < 3 || nextTitle.length > 200) return toast({ message: 'Judul harus terdiri dari 3–200 karakter.', variant: 'error' })
    setPending('title')
    try {
      const response = await updateCampaignTitle(campaignId, nextTitle)
      setCampaign(response.data)
      setTitle(response.data.title)
      toast({ message: 'Judul kampanye diperbarui.', variant: 'success' })
    } catch (caught) {
      toast({ message: getApiErrorMessage(caught, 'Judul kampanye tidak dapat diperbarui.'), variant: 'error' })
    } finally {
      setPending('')
    }
  }

  const saveImage = async () => {
    if (!image) return
    setPending('image')
    try {
      const response = await updateCampaignImage(campaignId, image)
      setCampaign(response.data)
      setImage(null)
      toast({ message: 'Foto utama kampanye diperbarui.', variant: 'success' })
    } catch (caught) {
      toast({ message: getApiErrorMessage(caught, 'Foto kampanye tidak dapat diperbarui.'), variant: 'error' })
    } finally {
      setPending('')
    }
  }

  const publish = async () => {
    setPending('publish')
    try {
      const response = await publishCampaign(campaignId)
      setCampaign(response.data)
      setConfirmingPublish(false)
      toast({ message: 'Kampanye berhasil diterbitkan.', variant: 'success' })
    } catch (caught) {
      toast({ message: getApiErrorMessage(caught, 'Kampanye tidak dapat diterbitkan.'), variant: 'error' })
    } finally {
      setPending('')
    }
  }

  const remove = async () => {
    setPending('delete')
    try {
      await deleteCampaign(campaignId)
      toast({ message: 'Kampanye draf berhasil dihapus.', variant: 'success' })
      navigate('/dashboard', { replace: true })
    } catch (caught) {
      toast({ message: getApiErrorMessage(caught, 'Kampanye tidak dapat dihapus.'), variant: 'error' })
    } finally {
      setPending('')
    }
  }

  if (loading) return <PageLoading />
  if (error || !campaign) return <main id="main-content" className="grid min-h-[100dvh] place-items-center px-5 text-center"><div><h1 className="text-3xl font-extrabold text-ink">Kampanye tidak dapat dimuat</h1><p role="alert" className="mt-3 text-sm text-muted">{error}</p><ButtonLink to="/dashboard" className="mt-6">Kembali ke dasbor</ButtonLink></div></main>

  const canPublish = ['DRAFT', 'REVIEW'].includes(campaign.status)
  const canDelete = canPublish && !campaign.publishedAt && campaign._count.orders === 0

  return <DashboardLayout active="overview">
    <div className="mx-auto max-w-4xl">
      <Link to={`/dashboard?campaignId=${campaign.id}&tab=overview`} className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-primary-dark"><ArrowLeft size={17} aria-hidden="true" />Kembali ke dasbor</Link>
      <header className="mt-5 flex flex-col justify-between gap-5 border-b border-line pb-7 sm:flex-row sm:items-end">
        <div><p className="text-xs font-extrabold uppercase tracking-[.12em] text-primary-dark">{statusLabels[campaign.status] ?? campaign.status}</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em] text-ink">Kelola kampanye</h1><p className="mt-2 text-sm leading-6 text-muted">Perbarui informasi yang aman tanpa mengubah pesanan, harga, atau target produksi.</p></div>
        {campaign.publishedAt && <ButtonLink to={`/campaigns/${campaign.id}`} variant="outline"><ExternalLink size={16} aria-hidden="true" />Halaman publik</ButtonLink>}
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_.9fr]">
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-7" aria-labelledby="campaign-title-heading"><h2 id="campaign-title-heading" className="text-xl font-extrabold text-ink">Judul kampanye</h2><p className="mt-1 text-xs leading-5 text-muted">Slug dan tautan publik tetap sama saat judul diubah.</p><div className="mt-5"><Input id="campaign-title" label="Judul" maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} /></div><Button type="button" className="mt-4" disabled={pending !== '' || title.trim() === campaign.title} loading={pending === 'title'} onClick={saveTitle}>Simpan judul</Button></section>

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-7" aria-labelledby="campaign-image-heading"><h2 id="campaign-image-heading" className="text-xl font-extrabold text-ink">Foto utama</h2><p className="mt-1 text-xs leading-5 text-muted">JPG, PNG, atau WebP. Maksimum 10 MB.</p><img src={previewUrl || campaign.heroImageUrl || '/hero/1.png'} alt={`Foto utama ${campaign.title}`} className="mt-5 aspect-[16/9] w-full rounded-xl border border-line object-cover" /><div className="mt-4 flex flex-wrap gap-2"><input id="campaign-image" type="file" accept="image/jpeg,image/png,image/webp" className="peer sr-only" onChange={(event) => { selectImage(event.target.files?.[0] ?? null); event.currentTarget.value = '' }} /><label htmlFor="campaign-image" className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-dark px-4 py-2 text-sm font-extrabold text-primary-dark peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-dark"><ImagePlus size={16} aria-hidden="true" />Pilih foto</label>{image && <Button type="button" onClick={saveImage} disabled={pending !== ''} loading={pending === 'image'}>Simpan foto</Button>}</div></section>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-7" aria-labelledby="campaign-actions-heading"><h2 id="campaign-actions-heading" className="text-xl font-extrabold text-ink">Status dan tindakan</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{canPublish && <div className="rounded-xl border border-line p-4"><h3 className="font-extrabold text-ink">Terbitkan kampanye</h3><p className="mt-1 text-xs leading-5 text-muted">Setelah diterbitkan, pelanggan dapat melihat kampanye dan membuat pre-order.</p><Button type="button" className="mt-4" disabled={pending !== ''} onClick={() => setConfirmingPublish(true)}><Send size={16} aria-hidden="true" />Terbitkan</Button></div>}<div className="rounded-xl border border-line p-4"><h3 className="font-extrabold text-ink">Hapus kampanye</h3><p className="mt-1 text-xs leading-5 text-muted">Hanya draf yang belum pernah diterbitkan dan belum memiliki pesanan yang dapat dihapus permanen.</p><Button type="button" variant="ghost" className="mt-4 text-error hover:border-error hover:bg-error/5 hover:!text-error" disabled={!canDelete || pending !== ''} onClick={() => setConfirmingDelete(true)}><Trash2 size={16} aria-hidden="true" />Hapus kampanye</Button></div></div></section>
    </div>
    <ConfirmDialog open={confirmingPublish} title="Terbitkan kampanye?" description="Kampanye akan tampil ke pelanggan dan mulai menerima pre-order." confirmLabel="Terbitkan" pending={pending === 'publish'} onCancel={() => setConfirmingPublish(false)} onConfirm={publish} />
    <ConfirmDialog open={confirmingDelete} title="Hapus kampanye draf?" description={`“${campaign.title}” beserta produk, foto, dan rencana biayanya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`} confirmLabel="Hapus kampanye" pending={pending === 'delete'} onCancel={() => setConfirmingDelete(false)} onConfirm={remove} />
  </DashboardLayout>
}
