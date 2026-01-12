import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Toast({ visible, message, conversationId, onClose, onJumpTo }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[90vw]">
        <span className="flex-1 text-sm">{message}</span>
        {onJumpTo && (
          <button
            onClick={() => {
              onJumpTo(conversationId)
              onClose()
            }}
            className="text-green-400 hover:text-green-300 text-sm font-medium px-2 py-1"
          >
            Jump to latest
          </button>
        )}
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
