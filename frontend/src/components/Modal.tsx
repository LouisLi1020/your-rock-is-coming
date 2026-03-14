import { useEffect } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** Optional primary action (e.g. Confirm). If not provided, only backdrop close or default close is used. */
  primaryAction?: { label: string; onClick: () => void }
  /** Optional secondary action (e.g. Cancel) */
  secondaryAction?: { label: string; onClick: () => void }
}

/** Centered modal matching project design (sand/green theme). */
export function Modal({
  open,
  onClose,
  title,
  children,
  primaryAction,
  secondaryAction,
}: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-[var(--border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-lora text-lg font-semibold text-bark">{title}</h3>
        </div>
        <div className="px-6 pb-6 text-sm text-bark-lt leading-relaxed">
          {children}
        </div>
        <div className="px-6 pb-6 flex flex-wrap gap-3 justify-end">
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-bark hover:bg-g50"
            >
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-g600 text-white hover:bg-g800"
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
