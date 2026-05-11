import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000'

function ChatbotPanel({ setExpenses, setObjects }) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: "Hi! I'm your AI expense parser 🤖\n\nTell me about an expense and I'll log it instantly. Try:\n• \"Spent ₹450 on groceries today\"\n• \"D-Mart receipt: milk 45, bread 35, eggs 120, total 200\""
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isOpen])

    const refreshData = (modelTarget) => {
        if (modelTarget !== 'Object') {
            axios.get(`${API_BASE}/api/expenses/`)
                .then(res => setExpenses(res.data))
                .catch(err => console.error('Refresh expenses error:', err))
        } else {
            axios.get(`${API_BASE}/api/objects/`)
                .then(res => setObjects(res.data))
                .catch(err => console.error('Refresh objects error:', err))
        }
    }

    const formatConfirmation = (data, model) => {
        if (model === 'Expense') {
            return `✅ Expense saved!\n• Amount: ₹${data.amount}\n• Category: ${data.category}\n• Date: ${data.date || 'Today'}${data.description ? `\n• Note: ${data.description}` : ''}`
        }
        return `✅ Record saved to MongoDB!\n• Name: ${data.name}\n• Details stored as flexible JSON`
    }

    const handleSend = async () => {
        if (!input.trim() || loading) return
        const userMsg = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', text: userMsg }])
        setLoading(true)

        try {
        const res = await axios.post(
            `${API_BASE}/api/chat/`,
            { message: userMsg },
            { timeout: 200000 }  // 200s — covers 180s Django read timeout + overhead
        )
            const { model, data } = res.data
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: formatConfirmation(data, model),
                success: true
            }])
            refreshData(model)
        } catch (err) {
            let errMsg
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                errMsg = 'The model is taking too long to respond. This can happen on the first request while the model loads into memory. Please try again.'
            } else if (err.response?.status === 503) {
                errMsg = err.response.data?.error || 'Ollama is not running. Please start it and try again.'
            } else {
                errMsg = err.response?.data?.error || 'Something went wrong. Please try again.'
            }
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: `❌ ${errMsg}`,
                error: true
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <>
            {/* Floating Action Button */}
            <button
                id="chatbot-fab"
                className={`chatbot-fab ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(prev => !prev)}
                title="AI Expense Parser"
                aria-label="Open AI expense chatbot"
            >
                <span className="fab-icon">{isOpen ? '✕' : '🤖'}</span>
                {!isOpen && <span className="fab-label">Ask AI</span>}
            </button>

            {/* Chat Panel */}
            <div className={`chatbot-panel ${isOpen ? 'chatbot-panel--open' : ''}`} role="dialog" aria-label="AI Expense Chat">

                {/* Header */}
                <div className="chatbot-header">
                    <div className="chatbot-header-info">
                        <div className="chatbot-avatar-icon">🤖</div>
                        <div>
                            <div className="chatbot-title">AI Expense Parser</div>
                            <div className="chatbot-subtitle">
                                <span className="status-dot"></span> Powered by LLaMA 3
                            </div>
                        </div>
                    </div>
                    <button
                        className="chatbot-close-btn"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close chat"
                    >✕</button>
                </div>

                {/* Messages */}
                <div className="chatbot-messages" id="chatbot-messages">
                    {messages.map((msg, i) => (
                        <div key={i} className={`chatbot-msg-row ${msg.role}`}>
                            {msg.role === 'assistant' && (
                                <div className="chatbot-msg-avatar">🤖</div>
                            )}
                            <div className={`chatbot-bubble ${msg.success ? 'bubble-success' : ''} ${msg.error ? 'bubble-error' : ''}`}>
                                {msg.text.split('\n').map((line, j) => (
                                    <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                        <div className="chatbot-msg-row assistant">
                            <div className="chatbot-msg-avatar">🤖</div>
                            <div className="chatbot-bubble typing-bubble">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="chatbot-input-row">
                    <input
                        id="chatbot-input"
                        className="chatbot-input"
                        type="text"
                        placeholder="e.g. Spent ₹450 on groceries..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        autoComplete="off"
                    />
                    <button
                        id="chatbot-send"
                        className="chatbot-send-btn"
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        aria-label="Send message"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </>
    )
}

export default ChatbotPanel
