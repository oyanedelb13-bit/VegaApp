'use client';
import { useRef, useEffect } from 'react';
import { MessageCircle, X, Mic, Send, Trash2, MicOff } from 'lucide-react';
import { useChatBot } from '../hooks/useChatBot';
import './ChatBot.css';

export function ChatBot() {
  const {
    isOpen, setIsOpen,
    messages, input, setInput,
    isLoading, isRecording,
    pendingTool, pendingToolSummary,
    sendText, startRecording, stopRecording,
    confirmTool, cancelTool, clearChat,
  } = useChatBot();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  }

  function handleMicClick() {
    if (isRecording) stopRecording();
    else startRecording();
  }

  return (
    <>
      {!isOpen && (
        <button
          className="chatbot-fab"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir asistente"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <span className="chatbot-avatar">V</span>
              <div>
                <h3>Asistente Vega</h3>
                <span className="chatbot-subtitle">Groq · llama-3.3</span>
              </div>
            </div>
            <div className="chatbot-actions">
              {messages.length > 0 && (
                <button className="chatbot-icon-btn" onClick={clearChat} title="Limpiar chat">
                  <Trash2 size={16} />
                </button>
              )}
              <button className="chatbot-icon-btn" onClick={() => setIsOpen(false)} title="Cerrar">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="chatbot-welcome">
                <h4>Hola, soy tu asistente</h4>
                <p>Puedo ayudarte a:</p>
                <ul>
                  <li>Crear pedidos por texto o voz</li>
                  <li>Cargar stock al camion</li>
                  <li>Crear clientes y productos</li>
                  <li>Consultar stock, pedidos, etc.</li>
                </ul>
                <p className="chatbot-hint">Proba: "5 papas, 4 zanahorias a Maria"</p>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`chatbot-msg chatbot-msg-${m.role}`}>
                <div className="chatbot-msg-bubble">{m.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-msg chatbot-msg-assistant">
                <div className="chatbot-msg-bubble chatbot-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {pendingTool && pendingToolSummary && (
            <div className="chatbot-confirm-overlay">
              <div className="chatbot-confirm-modal">
                <div className="chatbot-confirm-header">
                  <span className="chatbot-confirm-icon">{pendingToolSummary.icon}</span>
                  <h3>{pendingToolSummary.title}</h3>
                </div>
                <div className="chatbot-confirm-body">
                  {pendingToolSummary.fields.map((f, i) => (
                    <div key={i} className="chatbot-confirm-field">
                      <span className="chatbot-confirm-label">{f.label}</span>
                      <span className={`chatbot-confirm-value ${!f.ok ? 'missing' : ''}`}>
                        {f.value} {!f.ok && '⚠️'}
                      </span>
                    </div>
                  ))}
                  {pendingToolSummary.items.length > 0 && (
                    <div className="chatbot-confirm-items">
                      {pendingToolSummary.items.map((it, i) => (
                        <div key={i} className={`chatbot-confirm-item ${!it.ok ? 'missing' : ''}`}>
                          <span className="chatbot-confirm-emoji">{it.emoji}</span>
                          <span className="chatbot-confirm-item-name">{it.name}</span>
                          <span className="chatbot-confirm-item-detail">{it.detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {pendingToolSummary.warning && (
                    <div className="chatbot-confirm-warning">
                      ⚠️ {pendingToolSummary.warning}
                    </div>
                  )}
                </div>
                <div className="chatbot-confirm-actions">
                  <button className="chatbot-btn-cancel" onClick={cancelTool}>Cancelar</button>
                  <button className="chatbot-btn-confirm" onClick={confirmTool}>Confirmar y guardar</button>
                </div>
              </div>
            </div>
          )}

          <div className="chatbot-input-area">
            <textarea
              ref={inputRef}
              className="chatbot-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe o usa el microfono..."
              rows={1}
              disabled={isLoading}
            />
            <button
              className={`chatbot-mic-btn ${isRecording ? 'recording' : ''}`}
              onClick={handleMicClick}
              disabled={isLoading}
              title={isRecording ? 'Detener grabacion' : 'Grabar audio'}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              className="chatbot-send-btn"
              onClick={sendText}
              disabled={!input.trim() || isLoading}
              title="Enviar"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
