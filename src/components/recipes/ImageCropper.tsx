import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react'

/** Largeur maximale de l'image exportée (px). Au-delà, on redimensionne. */
const OUTPUT_MAX_WIDTH = 1280

interface ImageCropperProps {
  /** Fichier image à recadrer. */
  file: File
  /** Ratio largeur / hauteur du cadre (par défaut 4:3). */
  aspect?: number
  onCancel: () => void
  onConfirm: (file: File) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Éditeur de photo : recadrage (zoom + déplacement) dans un cadre à ratio
 * fixe, puis export recadré et redimensionné en JPEG. Permet de « choisir »
 * le cadrage et de « redimensionner » avant l'enregistrement.
 */
export default function ImageCropper({
  file,
  aspect = 4 / 3,
  onCancel,
  onConfirm,
}: ImageCropperProps) {
  const imageUrl = useMemo(() => URL.createObjectURL(file), [file])
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [frame, setFrame] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null)
  const [processing, setProcessing] = useState(false)

  const frameRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  )

  // Libère l'URL objet quand le fichier change / au démontage.
  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl)
  }, [imageUrl])

  // Dimensions naturelles de l'image (mise à jour asynchrone, au chargement).
  useEffect(() => {
    const img = new Image()
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = imageUrl
  }, [imageUrl])

  // Mesure du cadre (responsive).
  useEffect(() => {
    const node = frameRef.current
    if (!node) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) {
        setFrame({ w: rect.width, h: rect.height })
      }
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Fermeture au clavier (Échap).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [onCancel])

  const ready = natural !== null && frame.w > 0

  // Échelle « couverture » minimale : l'image remplit toujours le cadre.
  const baseScale = ready
    ? Math.max(frame.w / natural.w, frame.h / natural.h)
    : 1
  const displayScale = baseScale * zoom
  const displayWidth = ready ? natural.w * displayScale : 0
  const displayHeight = ready ? natural.h * displayScale : 0

  // Décalage centré par défaut, borné pour que l'image couvre le cadre.
  const centered = {
    x: (frame.w - displayWidth) / 2,
    y: (frame.h - displayHeight) / 2,
  }

  const rawOffset = offset ?? centered
  const currentOffset = {
    x: clamp(rawOffset.x, frame.w - displayWidth, 0),
    y: clamp(rawOffset.y, frame.h - displayHeight, 0),
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!ready) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      ox: currentOffset.x,
      oy: currentOffset.y,
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) {
      return
    }

    const nextX = drag.ox + (event.clientX - drag.x)
    const nextY = drag.oy + (event.clientY - drag.y)

    setOffset({
      x: clamp(nextX, frame.w - displayWidth, 0),
      y: clamp(nextY, frame.h - displayHeight, 0),
    })
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    dragRef.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  function handleZoomChange(nextZoom: number) {
    if (!ready) {
      setZoom(nextZoom)
      return
    }

    // Zoom centré sur le milieu du cadre.
    const nextScale = baseScale * nextZoom
    const centerImageX = (frame.w / 2 - currentOffset.x) / displayScale
    const centerImageY = (frame.h / 2 - currentOffset.y) / displayScale
    const nextWidth = natural.w * nextScale
    const nextHeight = natural.h * nextScale

    setOffset({
      x: clamp(frame.w / 2 - centerImageX * nextScale, frame.w - nextWidth, 0),
      y: clamp(frame.h / 2 - centerImageY * nextScale, frame.h - nextHeight, 0),
    })
    setZoom(nextZoom)
  }

  async function handleConfirm() {
    if (!ready) {
      return
    }

    setProcessing(true)

    try {
      const sourceX = -currentOffset.x / displayScale
      const sourceY = -currentOffset.y / displayScale
      const sourceWidth = frame.w / displayScale
      const sourceHeight = frame.h / displayScale

      const outputWidth = Math.min(OUTPUT_MAX_WIDTH, Math.round(sourceWidth))
      const outputHeight = Math.round(outputWidth / aspect)

      const canvas = document.createElement('canvas')
      canvas.width = outputWidth
      canvas.height = outputHeight

      const context = canvas.getContext('2d')
      if (!context) {
        onCancel()
        return
      }

      const image = new Image()
      image.src = imageUrl
      await image.decode()

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight,
      )

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.85)
      })

      if (!blob) {
        onCancel()
        return
      }

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
      const cropped = new File([blob], `${baseName}.jpg`, {
        type: 'image/jpeg',
      })

      onConfirm(cropped)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-espresso/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recadrer la photo"
        className="w-full max-w-lg rounded-[2rem] bg-card p-5 shadow-card ring-1 ring-bark sm:p-6"
      >
        <h2 className="text-xl font-black text-stone-950">
          Cadrer la photo
        </h2>

        <p className="mt-1 text-sm text-stone-500">
          Zoomez et déplacez pour choisir le cadrage.
        </p>

        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ aspectRatio: String(aspect), touchAction: 'none' }}
          className="relative mt-4 w-full cursor-grab overflow-hidden rounded-[1.5rem] bg-linen ring-1 ring-bark active:cursor-grabbing"
        >
          {imageUrl && ready && (
            <img
              src={imageUrl}
              alt="Aperçu à recadrer"
              draggable={false}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: displayWidth,
                height: displayHeight,
                transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
                maxWidth: 'none',
              }}
            />
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-bold text-hazel">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => handleZoomChange(Number(event.target.value))}
            aria-label="Zoom de la photo"
            className="h-2 flex-1 cursor-pointer accent-terracotta"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-linen px-6 py-3 font-bold text-cacao ring-1 ring-bark transition hover:bg-sand"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!ready || processing}
            className="rounded-full bg-terracotta px-6 py-3 font-bold text-white shadow-soft transition hover:bg-terracotta-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? 'Traitement…' : 'Valider le cadrage'}
          </button>
        </div>
      </div>
    </div>
  )
}
