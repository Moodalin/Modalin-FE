import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Move, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AvatarCropDialogProps = {
  file: File
  mode?: 'avatar' | 'banner'
  onCancel: () => void
  onConfirm: (file: File) => void
}

type CropRect = {
  sourceX: number
  sourceY: number
  sourceWidth: number
  sourceHeight: number
}

const AVATAR_OUTPUT_SIZE = 512
const BANNER_OUTPUT_WIDTH = 1280
const BANNER_OUTPUT_HEIGHT = 720
const MIN_ZOOM = 1
const MAX_ZOOM = 3


function getCropRect(image: HTMLImageElement, zoom: number, positionX: number, positionY: number, aspectRatio: number): CropRect {
  const uncroppedWidth = Math.min(image.naturalWidth, image.naturalHeight * aspectRatio)
  const uncroppedHeight = uncroppedWidth / aspectRatio
  const sourceWidth = uncroppedWidth / zoom
  const sourceHeight = uncroppedHeight / zoom
  const horizontalRoom = (image.naturalWidth - sourceWidth) / 2
  const verticalRoom = (image.naturalHeight - sourceHeight) / 2
  return {
    sourceX: horizontalRoom - (positionX / 100) * horizontalRoom,
    sourceY: verticalRoom - (positionY / 100) * verticalRoom,
    sourceWidth,
    sourceHeight,
  }
}

function drawCrop(canvas: HTMLCanvasElement, image: HTMLImageElement, zoom: number, positionX: number, positionY: number, outputWidth: number, outputHeight: number) {
  const context = canvas.getContext('2d')
  if (!context) return false
  const crop = getCropRect(image, zoom, positionX, positionY, outputWidth / outputHeight)
  context.clearRect(0, 0, outputWidth, outputHeight)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, crop.sourceX, crop.sourceY, crop.sourceWidth, crop.sourceHeight, 0, 0, outputWidth, outputHeight)
  return true
}

function positionLabel(value: number, negative: string, positive: string) {
  if (Math.abs(value) < 1) return 'Tengah'
  return `${Math.round(Math.abs(value))}% ke ${value < 0 ? negative : positive}`
}

export function AvatarCropDialog({ file, mode = 'avatar', onCancel, onConfirm }: AvatarCropDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const instructionId = useId()
  const errorId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mountedRef = useRef(true)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; positionX: number; positionY: number } | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [positionX, setPositionX] = useState(0)
  const [positionY, setPositionY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [exportError, setExportError] = useState('')
  const [exporting, setExporting] = useState(false)
  const isBanner = mode === 'banner'
  const outputWidth = isBanner ? BANNER_OUTPUT_WIDTH : AVATAR_OUTPUT_SIZE
  const outputHeight = isBanner ? BANNER_OUTPUT_HEIGHT : AVATAR_OUTPUT_SIZE
  const aspectRatio = outputWidth / outputHeight
  const inputIdPrefix = isBanner ? 'banner-crop' : 'avatar-crop'

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus())
    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [])

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    const nextImage = new Image()
    let active = true
    nextImage.src = objectUrl
    nextImage.decode()
      .then(() => {
        if (!active) return
        if (!nextImage.naturalWidth || !nextImage.naturalHeight) throw new Error('Invalid image dimensions')
        setImage(nextImage)
      })
      .catch(() => {
        if (active) setLoadError(isBanner ? 'Banner tidak dapat dibaca browser. Pilih file JPEG, PNG, atau WebP lain.' : 'Gambar tidak dapat dibaca browser. Pilih file JPEG, PNG, atau WebP lain.')
      })
    return () => {
      active = false
      nextImage.src = ''
      URL.revokeObjectURL(objectUrl)
    }
  }, [file, isBanner])

  useEffect(() => {
    if (image && canvasRef.current) drawCrop(canvasRef.current, image, zoom, positionX, positionY, outputWidth, outputHeight)
  }, [image, outputHeight, outputWidth, positionX, positionY, zoom])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !exporting) {
      event.preventDefault()
      onCancel()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
    if (!focusable?.length) {
      event.preventDefault()
      dialogRef.current?.focus()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const updateZoom = (nextZoom: number) => {
    setZoom(nextZoom)
    if (!image) return
    const nextCrop = getCropRect(image, nextZoom, 0, 0, aspectRatio)
    if (image.naturalWidth - nextCrop.sourceWidth < 0.5) setPositionX(0)
    if (image.naturalHeight - nextCrop.sourceHeight < 0.5) setPositionY(0)
  }

  const moveFromDrag = (deltaPixels: number, viewportPixels: number, sourcePixels: number, sourceSize: number) => {
    const availableSourcePixels = (sourcePixels - sourceSize) / 2
    if (availableSourcePixels <= 0 || viewportPixels <= 0) return 0
    return (deltaPixels / viewportPixels) * (sourceSize / availableSourcePixels) * 100
  }

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!image || exporting) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, positionX, positionY }
    setDragging(true)
  }

  const continueDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || !image) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const { sourceWidth, sourceHeight } = getCropRect(image, zoom, positionX, positionY, aspectRatio)
    const horizontalChange = moveFromDrag(event.clientX - drag.startX, bounds.width, image.naturalWidth, sourceWidth)
    const verticalChange = moveFromDrag(event.clientY - drag.startY, bounds.height, image.naturalHeight, sourceHeight)
    setPositionX(Math.min(Math.max(drag.positionX + horizontalChange, -100), 100))
    setPositionY(Math.min(Math.max(drag.positionY + verticalChange, -100), 100))
  }

  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setDragging(false)
  }

  const confirmCrop = () => {
    if (!image || exporting) return
    setExportError('')
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = outputWidth
    outputCanvas.height = outputHeight
    if (!drawCrop(outputCanvas, image, zoom, positionX, positionY, outputWidth, outputHeight)) {
      setExportError(isBanner ? 'Banner tidak dapat diproses. Coba lagi.' : 'Foto tidak dapat diproses. Coba lagi.')
      return
    }
    setExporting(true)
    outputCanvas.toBlob((blob) => {
      if (!mountedRef.current) return
      if (!blob || blob.type !== 'image/webp') {
        setExporting(false)
        setExportError(isBanner ? 'Browser ini tidak dapat membuat banner WebP. Coba browser lain.' : 'Browser ini tidak dapat membuat foto WebP. Coba browser lain.')
        return
      }
      onConfirm(new File([blob], isBanner ? 'group-banner.webp' : 'profile-avatar.webp', { type: 'image/webp' }))
    }, 'image/webp', 0.9)
  }

  const crop = image ? getCropRect(image, zoom, positionX, positionY, aspectRatio) : null
  const canPanHorizontally = Boolean(image && crop && image.naturalWidth - crop.sourceWidth >= 0.5)
  const canPanVertically = Boolean(image && crop && image.naturalHeight - crop.sourceHeight >= 0.5)
  const currentError = loadError || exportError

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/50 sm:items-center sm:p-5" role="presentation" onPointerDown={(event) => { if (!exporting && event.target === event.currentTarget) onCancel() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={`${descriptionId} ${instructionId}${currentError ? ` ${errorId}` : ''}`} aria-busy={exporting} tabIndex={-1} onKeyDown={handleKeyDown} className={`max-h-[calc(100dvh-0.5rem)] w-full overflow-y-auto rounded-t-2xl border border-line bg-white p-5 shadow-[0_24px_60px_rgba(29,37,34,.24)] sm:rounded-2xl sm:p-6 ${isBanner ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
        <div className="flex items-start justify-between gap-4">
          <div><h2 id={titleId} className="text-xl font-extrabold text-ink">{isBanner ? 'Atur banner kelompok' : 'Atur foto profil'}</h2><p id={descriptionId} className="mt-1 text-sm leading-6 text-muted">{isBanner ? 'Hasil disimpan sebagai WebP 1280 × 720 piksel.' : 'Hasil disimpan sebagai WebP 512 × 512 piksel.'}</p></div>
          <button type="button" onClick={onCancel} disabled={exporting} aria-label={isBanner ? 'Tutup pengaturan banner' : 'Tutup pengaturan foto'} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-cream hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark disabled:cursor-not-allowed disabled:opacity-50"><X size={19} aria-hidden="true" /></button>
        </div>

        <div className="mt-5">
          <div className={`relative mx-auto w-full overflow-hidden rounded-xl bg-cream ${isBanner ? 'aspect-video max-w-[640px]' : 'aspect-square max-w-[320px]'} ${image && !exporting ? dragging ? 'cursor-grabbing' : 'cursor-grab' : ''}`} onPointerDown={startDrag} onPointerMove={continueDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
            <canvas ref={canvasRef} width={outputWidth} height={outputHeight} role="img" aria-label={isBanner ? 'Pratinjau hasil potongan banner' : 'Pratinjau hasil potongan foto'} aria-describedby={instructionId} className={`h-full w-full touch-none select-none ${image ? 'opacity-100' : 'opacity-0'}`} />
            {!image && !loadError && <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm font-bold text-muted" role="status">{isBanner ? 'Membuka banner…' : 'Membuka gambar…'}</div>}
            {loadError && <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm font-bold text-error">{isBanner ? 'Banner tidak tersedia' : 'Gambar tidak tersedia'}</div>}
            {isBanner ? <div className="pointer-events-none absolute inset-px rounded-[calc(.75rem-1px)] border-2 border-white/90 shadow-[inset_0_0_0_1px_rgba(29,37,34,.28)]" aria-hidden="true" /> : <div className="pointer-events-none absolute inset-px rounded-full border-2 border-white shadow-[0_0_0_999px_rgba(29,37,34,.34),0_0_0_1px_rgba(29,37,34,.28)]" aria-hidden="true" />}
            {image && <span className="pointer-events-none absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-lg bg-ink/75 px-2.5 py-1.5 text-xs font-bold text-white" aria-hidden="true"><Move size={14} />{isBanner ? 'Geser banner' : 'Geser foto'}</span>}
          </div>
          <p id={instructionId} className="mt-3 text-center text-xs leading-5 text-muted">{isBanner ? 'Geser banner atau gunakan kontrol di bawah untuk mengatur komposisi 16:9.' : 'Geser foto atau gunakan kontrol di bawah. Lingkaran menunjukkan area yang tampil sebagai avatar.'}</p>
        </div>

        <div className="mt-5 grid gap-4">
          <div>
            <div className="flex items-center justify-between gap-4"><label htmlFor={`${inputIdPrefix}-zoom`} className="text-sm font-extrabold text-ink">Perbesaran</label><output htmlFor={`${inputIdPrefix}-zoom`} className="text-xs font-bold text-primary-dark">{zoom.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}×</output></div>
            <input id={`${inputIdPrefix}-zoom`} type="range" min={MIN_ZOOM} max={MAX_ZOOM} step="0.01" value={zoom} onChange={(event) => updateZoom(Number(event.target.value))} disabled={!image || exporting} className="mt-2 h-11 w-full cursor-pointer accent-primary-dark disabled:cursor-not-allowed disabled:opacity-50" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-3"><label htmlFor={`${inputIdPrefix}-x`} className="text-sm font-extrabold text-ink">Posisi horizontal</label><output htmlFor={`${inputIdPrefix}-x`} className="text-xs font-bold text-primary-dark">{positionLabel(positionX, 'kiri', 'kanan')}</output></div>
              <input id={`${inputIdPrefix}-x`} type="range" min="-100" max="100" step="1" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} aria-valuetext={positionLabel(positionX, 'kiri', 'kanan')} disabled={!canPanHorizontally || exporting} className="mt-2 h-11 w-full cursor-pointer accent-primary-dark disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3"><label htmlFor={`${inputIdPrefix}-y`} className="text-sm font-extrabold text-ink">Posisi vertikal</label><output htmlFor={`${inputIdPrefix}-y`} className="text-xs font-bold text-primary-dark">{positionLabel(positionY, 'atas', 'bawah')}</output></div>
              <input id={`${inputIdPrefix}-y`} type="range" min="-100" max="100" step="1" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} aria-valuetext={positionLabel(positionY, 'atas', 'bawah')} disabled={!canPanVertically || exporting} className="mt-2 h-11 w-full cursor-pointer accent-primary-dark disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
          </div>
        </div>

        {currentError && <p id={errorId} role="alert" className="mt-4 rounded-xl bg-error/10 px-3 py-2 text-sm font-bold text-error">{currentError}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onCancel} disabled={exporting}>Batal</Button><Button type="button" variant="dark" onClick={confirmCrop} disabled={!image || exporting} loading={exporting}>{exporting ? isBanner ? 'Memproses banner…' : 'Memproses foto…' : isBanner ? 'Gunakan banner' : 'Gunakan foto'}</Button></div>
      </div>
    </div>,
    document.body,
  )
}
