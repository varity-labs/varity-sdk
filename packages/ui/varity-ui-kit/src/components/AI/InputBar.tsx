/**
 * InputBar - Chat input component
 *
 * Input field for sending chat messages with support for keyboard shortcuts.
 */

import React, { useState, KeyboardEvent } from 'react'

export interface InputBarProps {
  /** Placeholder text */
  placeholder?: string
  /** Send callback */
  onSend: (message: string) => void
  /** Disabled state */
  disabled?: boolean
  /** Show send button */
  showSendButton?: boolean
  /** Max length */
  maxLength?: number
  /** Support multiline (Enter = newline, Ctrl+Enter = send) */
  multiline?: boolean
}

/**
 * InputBar Component
 */
export const InputBar: React.FC<InputBarProps> = ({
  placeholder = 'Type a message...',
  onSend,
  disabled = false,
  showSendButton = true,
  maxLength = 1000,
  multiline = false
}) => {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage)
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (multiline) {
      // Ctrl/Cmd + Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSend()
      }
    } else {
      // Enter to send
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }
  }

  const characterCount = message.length

  return (
    <div
      className="varity-input-bar"
      style={{
        padding: '16px 20px',
        backgroundColor: 'var(--varity-bg-card, #ffffff)',
        borderTop: '1px solid var(--varity-border-color, #e0e0e0)',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end'
      }}
    >
      {/* Input Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        {multiline ? (
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid var(--varity-border-color, #e0e0e0)',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              backgroundColor: disabled ? 'var(--varity-bg-disabled, #f5f5f5)' : 'var(--varity-bg-input, #ffffff)',
              color: 'var(--varity-text-primary, #212121)',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--varity-primary-color, #1976d2)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--varity-border-color, #e0e0e0)'
            }}
          />
        ) : (
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid var(--varity-border-color, #e0e0e0)',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              backgroundColor: disabled ? 'var(--varity-bg-disabled, #f5f5f5)' : 'var(--varity-bg-input, #ffffff)',
              color: 'var(--varity-text-primary, #212121)',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--varity-primary-color, #1976d2)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--varity-border-color, #e0e0e0)'
            }}
          />
        )}

        {/* Character count */}
        {maxLength && characterCount > maxLength * 0.8 && (
          <span
            style={{
              position: 'absolute',
              bottom: '-20px',
              right: '0',
              fontSize: '11px',
              color: characterCount >= maxLength
                ? 'var(--varity-error-color, #f44336)'
                : 'var(--varity-text-secondary, #757575)'
            }}
          >
            {characterCount}/{maxLength}
          </span>
        )}
      </div>

      {/* Send Button */}
      {showSendButton && (
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: disabled || !message.trim()
              ? 'var(--varity-bg-disabled, #e0e0e0)'
              : 'var(--varity-primary-color, #1976d2)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: disabled || !message.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            if (!disabled && message.trim()) {
              e.currentTarget.style.backgroundColor = 'var(--varity-primary-dark, #1565c0)'
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && message.trim()) {
              e.currentTarget.style.backgroundColor = 'var(--varity-primary-color, #1976d2)'
            }
          }}
        >
          <span>Send</span>
          <span>▶</span>
        </button>
      )}

      {/* Keyboard hint */}
      {multiline && (
        <span
          style={{
            fontSize: '11px',
            color: 'var(--varity-text-secondary, #757575)',
            position: 'absolute',
            bottom: '-20px',
            left: '20px'
          }}
        >
          {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter to send
        </span>
      )}
    </div>
  )
}
