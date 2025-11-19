import { useState, useRef, useEffect } from 'react'
import { chatService } from '../services/chatService'
import './ChatBubble.css'

function ChatBubble({ userInfo }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Empecemos a hablar, te puedo ayudar con las dudas que tengas',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || loading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      // Preparar contexto de conversación (últimos 5 mensajes)
      const conversationContext = messages
        .slice(-5)
        .map(msg => `${msg.type === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`)
        .join('\n')

      const data = await chatService.query(userMessage.content, conversationContext)

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.answer || 'No se pudo generar una respuesta',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      // Mensaje de error amigable sin detalles técnicos
      let errorMessage = 'Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta reformular tu pregunta.'
      
      // Solo mostrar errores específicos y amigables
      if (error.error?.code === 'CONFIGURATION_ERROR') {
        errorMessage = 'El servicio de consultas no está configurado correctamente. Por favor, contacta al administrador.'
      } else if (error.error?.code === 'VALIDATION_ERROR') {
        errorMessage = error.error.message || errorMessage
      }

      const errorMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: errorMessage,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (content, event) => {
    navigator.clipboard.writeText(content).then(() => {
      // Mostrar feedback visual
      if (event && event.target) {
        const button = event.target
        const originalText = button.textContent
        button.textContent = '✓ Copiado'
        setTimeout(() => {
          button.textContent = originalText
        }, 2000)
      }
    }).catch(err => {
      console.error('Error al copiar:', err)
    })
  }

  const handleExport = (messagesToExport) => {
    const exportData = messagesToExport.map(msg => {
      return `${msg.type === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\nFecha: ${msg.timestamp.toLocaleString('es-ES')}\n---\n`
    }).join('\n')

    const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chat-contratos-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = async (messagesToExport) => {
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      let y = 20
      const pageHeight = doc.internal.pageSize.height
      const margin = 20
      const lineHeight = 7

      messagesToExport.forEach((msg, index) => {
        if (y > pageHeight - 40) {
          doc.addPage()
          y = 20
        }

        // Tipo de mensaje
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`${msg.type === 'user' ? 'Usuario' : 'Asistente'} - ${msg.timestamp.toLocaleString('es-ES')}`, margin, y)
        y += lineHeight

        // Contenido
        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        const lines = doc.splitTextToSize(msg.content, 170)
        lines.forEach(line => {
          if (y > pageHeight - 20) {
            doc.addPage()
            y = 20
          }
          doc.text(line, margin, y)
          y += lineHeight
        })

        y += lineHeight
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, y, 190, y)
        y += lineHeight
      })

      doc.save(`chat-contratos-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      alert('Error al exportar PDF. Por favor, intenta exportar como TXT.')
    }
  }

  return (
    <div className="chat-bubble-container">
      {!isOpen && (
        <button
          className="chat-bubble-button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat"
        >
          <span className="chat-icon">💬</span>
        </button>
      )}

      {isOpen && (
        <div className="chat-window" ref={chatContainerRef}>
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-header-icon">🤖</span>
              <div>
                <h3>Asistente de Contratos</h3>
                {userInfo && (
                  <p className="chat-header-subtitle">Consultas para {userInfo.clienteNombre}</p>
                )}
              </div>
            </div>
            <div className="chat-header-actions">
              {messages.length > 1 && (
                <>
                  <button
                    className="chat-action-btn"
                    onClick={() => handleExport(messages)}
                    title="Exportar como TXT"
                  >
                    📄
                  </button>
                  <button
                    className="chat-action-btn"
                    onClick={() => handleExportPDF(messages)}
                    title="Exportar como PDF"
                  >
                    📑
                  </button>
                </>
              )}
              <button
                className="chat-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar chat"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.type}`}>
                <div className="message-content">
                  {message.content.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
                <div className="message-footer">
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <button
                    className="message-copy-btn"
                    onClick={(e) => handleCopy(message.content, e)}
                    title="Copiar mensaje"
                  >
                    📋
                  </button>
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message bot">
                <div className="message-content">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              type="text"
              className="chat-input"
              placeholder="Escribe tu pregunta sobre contratos..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputValue.trim() || loading}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default ChatBubble

