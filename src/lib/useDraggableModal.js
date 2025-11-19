import { useEffect, useRef } from 'react'

/**
 * Hook para hacer movibles los modales arrastrando la barra de título.
 * Uso:
 *   const { modalRef, handleRef } = useDraggableModal(activo)
 *   <div ref={modalRef} className="modal-card ...">
 *     <div ref={handleRef} className="modal-header">...</div>
 *   </div>
 */
export function useDraggableModal(enabled = true) {
  const modalRef = useRef(null)
  const handleRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const modal = modalRef.current
    const handle = handleRef.current
    if (!modal || !handle) return

    let isDragging = false
    let startX = 0
    let startY = 0
    let initialLeft = 0
    let initialTop = 0

    const onMouseDown = (e) => {
      // Solo botón izquierdo
      if (e.button !== 0) return
      isDragging = true
      startX = e.clientX
      startY = e.clientY

      const rect = modal.getBoundingClientRect()
      initialLeft = rect.left
      initialTop = rect.top

      modal.style.position = 'fixed'
      modal.style.margin = '0'

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }

    const onMouseMove = (e) => {
      if (!isDragging) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY

      const rawLeft = initialLeft + dx
      const rawTop = initialTop + dy

      const modalRect = modal.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      const margin = 16
      const maxLeft = viewportWidth - modalRect.width - margin
      const maxTop = viewportHeight - modalRect.height - margin

      const clampedLeft = Math.min(Math.max(rawLeft, margin), Math.max(maxLeft, margin))
      const clampedTop = Math.min(Math.max(rawTop, margin), Math.max(maxTop, margin))

      modal.style.left = `${clampedLeft}px`
      modal.style.top = `${clampedTop}px`
    }

    const onMouseUp = () => {
      isDragging = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    handle.addEventListener('mousedown', onMouseDown)

    return () => {
      handle.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [enabled])

  return { modalRef, handleRef }
}


