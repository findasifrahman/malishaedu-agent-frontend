import React, { useState, useEffect } from 'react'
import { Loader2, Bot, User as UserIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import api from '../../services/api'

export default function AdminChatPage() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/conversations')
      setConversations(response.data)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Conversation List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Recent Conversations</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    selectedConversation?.id === conv.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {conv.user ? (
                      <>
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-sm text-gray-900">
                          {conv.user.name || conv.user.email}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Anonymous</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {conv.message_count} messages • {conv.updated_at ? new Date(conv.updated_at).toLocaleDateString() : ''}
                  </p>
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No conversations yet</p>
              )}
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {selectedConversation ? (
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="font-medium text-gray-900">
                    {selectedConversation.user ? (
                      `Chat with ${selectedConversation.user.name || selectedConversation.user.email}`
                    ) : (
                      'Anonymous Chat'
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.message_count} messages
                  </p>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                    selectedConversation.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No messages in this conversation</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a conversation to view messages</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
