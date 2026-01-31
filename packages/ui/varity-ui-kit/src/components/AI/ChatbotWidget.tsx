/**
 * ChatbotWidget - AI-powered chatbot interface
 *
 * Full-featured chatbot widget for conversational AI interactions.
 */

import React, { useState, useRef, useEffect } from 'react'
import { MessageBubble, Message } from './MessageBubble'
import { InputBar } from './InputBar'

export interface ChatbotWidgetProps {
  /** Widget title */
  title?: string
  /** Placeholder text for input */
  placeholder?: string
  /** Welcome message */
  welcomeMessage?: string
  /** Send message callback */
  onSendMessage: (message: string) => Promise<string>
  /** Widget height */
  height?: number | string
  /** Widget width */
  width?: number | string
  /** Initial messages */
  initialMessages?: Message[]
  /** Show timestamp on messages */
  showTimestamp?: boolean
  /** Enable markdown rendering */
  enableMarkdown?: boolean
  /** Bot avatar URL */
  botAvatar?: string
  /** User avatar URL */
  userAvatar?: string
  /** Loading message text */
  loadingMessage?: string
  /** Error message text */
  errorMessage?: string
}

/**
 * ChatbotWidget Component
 *
 * @example
 * ```tsx
 * <ChatbotWidget
 *   title="AI Assistant"
 *   welcomeMessage="Hello! How can I help you today?"
 *   onSendMessage={async (msg) => {
 *     const response = await client.compute.query(msg)
 *     return response.answer
 *   }}
 *   height={500}
 * />
 * ```
 */
export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  title = 'AI Assistant',
  placeholder = 'Type your message...',
  welcomeMessage = 'Hello! How can I help you today?',
  onSendMessage,
  height = 600,
  width = '100%',
  initialMessages = [],
  showTimestamp = true,
  enableMarkdown = false,
  botAvatar,
  userAvatar,
  loadingMessage = 'Thinking...',
  errorMessage = 'Sorry, something went wrong. Please try again.'
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: welcomeMessage,
      sender: 'bot',
      timestamp: new Date()
    },
    ...initialMessages
  ])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, userMessage])

    // Show loading
    setIsLoading(true)

    try {
      // Call API
      const response = await onSendMessage(content)

      // Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      // Add error message
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        sender: 'bot',
        timestamp: new Date(),
        error: true
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="varity-chatbot-widget"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--varity-bg-card, #ffffff)',
        border: '1px solid var(--varity-border-color, #e0e0e0)',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--varity-primary-color, #1976d2)',
          color: 'white',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <span style={{ fontSize: '24px' }}>🤖</span>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          {title}
        </h3>
      </div>

      {/* Messages Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: 'var(--varity-bg-secondary, #f9f9f9)'
        }}
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            showTimestamp={showTimestamp}
            enableMarkdown={enableMarkdown}
            botAvatar={botAvatar}
            userAvatar={userAvatar}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <MessageBubble
            message={{
              id: 'loading',
              content: loadingMessage,
              sender: 'bot',
              timestamp: new Date(),
              loading: true
            }}
            botAvatar={botAvatar}
          />
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <InputBar
        placeholder={placeholder}
        onSend={handleSendMessage}
        disabled={isLoading}
      />
    </div>
  )
}
