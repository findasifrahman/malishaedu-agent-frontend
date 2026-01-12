import React, { useEffect, useRef } from 'react'
import { Pin, PinOff, Ban, Unlock, Trash2, MoreVertical } from 'lucide-react'

export default function ContextMenu({ 
  visible, 
  x, 
  y, 
  conversation, 
  onClose, 
  onPin, 
  onUnpin, 
  onBlock, 
  onUnblock, 
  onDelete 
}) {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!visible) return

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }

    const handleScroll = () => {
      onClose()
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('scroll', handleScroll, true)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [visible, onClose])

  if (!visible || !conversation) return null

  // Adjust position to keep menu in viewport
  const style = {
    position: 'fixed',
    left: `${Math.min(x, window.innerWidth - 200)}px`,
    top: `${Math.min(y, window.innerHeight - 200)}px`,
    zIndex: 1000
  }

  return (
    <div
      ref={menuRef}
      style={style}
      className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px]"
    >
      {conversation.pinned ? (
        <button
          onClick={() => {
            onUnpin(conversation.conversation_id)
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <PinOff className="w-4 h-4" />
          Unpin
        </button>
      ) : (
        <button
          onClick={() => {
            onPin(conversation.conversation_id)
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <Pin className="w-4 h-4" />
          Pin
        </button>
      )}
      
      {conversation.blocked ? (
        <button
          onClick={() => {
            onUnblock(conversation.conversation_id)
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <Unlock className="w-4 h-4" />
          Unblock
        </button>
      ) : (
        <button
          onClick={() => {
            onBlock(conversation.conversation_id)
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
        >
          <Ban className="w-4 h-4" />
          Block
        </button>
      )}
      
      <div className="border-t border-gray-200 my-1" />
      
      <button
        onClick={() => {
          onDelete(conversation.conversation_id)
          onClose()
        }}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  )
}
