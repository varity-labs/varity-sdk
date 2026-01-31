/**
 * MessageBubble - Chat message bubble component
 *
 * Displays a single chat message with avatar, timestamp, and formatting.
 */

import React from 'react'

export interface Message {
  /** Unique message ID */
  id: string
  /** Message content */
  content: string
  /** Message sender */
  sender: 'user' | 'bot'
  /** Message timestamp */
  timestamp: Date
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: boolean
}

export interface MessageBubbleProps {
  /** Message data */
  message: Message
  /** Show timestamp */
  showTimestamp?: boolean
  /** Enable markdown rendering */
  enableMarkdown?: boolean
  /** Bot avatar URL */
  botAvatar?: string
  /** User avatar URL */
  userAvatar?: string
}

/**
 * MessageBubble Component
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showTimestamp = true,
  enableMarkdown = false,
  botAvatar,
  userAvatar
}) => {
  const isBot = message.sender === 'bot'

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderContent = () => {
    if (message.loading) {
      return (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div className="typing-dot" style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--varity-text-secondary, #757575)',
            animation: 'typing 1.4s infinite'
          }} />
          <div className="typing-dot" style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--varity-text-secondary, #757575)',
            animation: 'typing 1.4s infinite 0.2s'
          }} />
          <div className="typing-dot" style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--varity-text-secondary, #757575)',
            animation: 'typing 1.4s infinite 0.4s'
          }} />
        </div>
      )
    }

    // Simple markdown-like rendering (basic support)
    if (enableMarkdown) {
      let formattedContent = message.content
      // Bold: **text**
      formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic: *text*
      formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code: `code`
      formattedContent = formattedContent.replace(/`(.*?)`/g, '<code style="background-color: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>')

      return <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
    }

    return <span>{message.content}</span>
  }

  return (
    <div
      className={`varity-message-bubble ${isBot ? 'bot' : 'user'}`}
      style={{
        display: 'flex',
        flexDirection: isBot ? 'row' : 'row-reverse',
        gap: '12px',
        alignItems: 'flex-start'
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: isBot
            ? 'var(--varity-primary-color, #1976d2)'
            : 'var(--varity-accent-color, #ff5722)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: 600,
          flexShrink: 0,
          backgroundImage: (isBot ? botAvatar : userAvatar) ? `url(${isBot ? botAvatar : userAvatar})` : undefined,
          backgroundSize: 'cover'
        }}
      >
        {!isBot && !userAvatar && 'U'}
        {isBot && !botAvatar && '🤖'}
      </div>

      {/* Message Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          maxWidth: '70%'
        }}
      >
        {/* Bubble */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: isBot ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
            backgroundColor: isBot
              ? message.error
                ? 'var(--varity-error-light, #ffebee)'
                : 'var(--varity-bg-card, #ffffff)'
              : 'var(--varity-primary-color, #1976d2)',
            color: isBot
              ? message.error
                ? 'var(--varity-error-color, #f44336)'
                : 'var(--varity-text-primary, #212121)'
              : 'white',
            fontSize: '14px',
            lineHeight: 1.5,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            wordBreak: 'break-word'
          }}
        >
          {renderContent()}
        </div>

        {/* Timestamp */}
        {showTimestamp && !message.loading && (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--varity-text-secondary, #757575)',
              paddingLeft: isBot ? '4px' : '0',
              paddingRight: isBot ? '0' : '4px',
              alignSelf: isBot ? 'flex-start' : 'flex-end'
            }}
          >
            {formatTimestamp(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  )
}

// Add typing animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.innerHTML = `
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
      30% { transform: translateY(-10px); opacity: 1; }
    }
  `
  document.head.appendChild(style)
}
