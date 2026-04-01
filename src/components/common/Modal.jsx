import { useEffect } from 'react'

function Modal({ children, onClose, open, subtitle, title }) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="mindi-modal" role="presentation" onClick={onClose}>
      <div className="mindi-modal__backdrop" />

      <div
        className="mindi-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mindi-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mindi-modal__header">
          <div>
            <div className="mindi-modal__eyebrow">Mindi Guide</div>
            <h2 className="mindi-modal__title" id="mindi-modal-title">
              {title}
            </h2>
            {subtitle ? (
              <p className="mindi-modal__subtitle">{subtitle}</p>
            ) : null}
          </div>

          <button
            className="mindi-modal__close"
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="mindi-modal__content">{children}</div>
      </div>
    </div>
  )
}

export default Modal
