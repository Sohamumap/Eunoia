import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Send, Inbox as InboxIcon, ArrowLeft } from 'lucide-react';

const formatTimeAgo = (dateString) => {
  const now = new Date();
  const posted = new Date(dateString);
  const diffMs = now - posted;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function Inbox() {
  const { api } = useAuth();
  const [searchParams] = useSearchParams();
  const recipientId = searchParams.get('to');
  
  const [messages, setMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inbox'); // 'inbox' | 'sent' | 'compose'
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientUserId, setRecipientUserId] = useState(recipientId || '');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [api]);

  const fetchMessages = async () => {
    try {
      const [inboxRes, sentRes] = await Promise.all([
        api('get', '/messages/inbox'),
        api('get', '/messages/sent')
      ]);
      setMessages(inboxRes.data.messages || []);
      setSentMessages(sentRes.data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!subject.trim() || !body.trim() || !recipientUserId.trim()) return;
    
    setSending(true);
    try {
      await api('post', '/messages', {
        recipient_id: recipientUserId,
        subject: subject,
        body: body
      });
      setSubject('');
      setBody('');
      setRecipientUserId('');
      setTab('sent');
      await fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please check the user ID and try again.');
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await api('put', `/messages/${messageId}/read`);
      await fetchMessages();
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <p className="font-sans text-gray-600">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-sans text-2xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="font-sans text-sm text-gray-600">Private messages between anonymous users</p>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab('inbox')}
              className={`px-6 py-3 font-sans text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                tab === 'inbox'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <InboxIcon size={16} />
              Inbox ({messages.filter(m => !m.read).length})
            </button>
            <button
              onClick={() => setTab('sent')}
              className={`px-6 py-3 font-sans text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                tab === 'sent'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Send size={16} />
              Sent
            </button>
            <button
              onClick={() => setTab('compose')}
              className={`px-6 py-3 font-sans text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                tab === 'compose'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail size={16} />
              Compose
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {tab === 'inbox' && (
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <InboxIcon size={48} className="mx-auto text-gray-400 mb-3" />
                    <p className="font-sans text-gray-600 text-sm">No messages yet</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-md border transition-colors ${
                        msg.read
                          ? 'border-gray-200 bg-white'
                          : 'border-blue-200 bg-blue-50'
                      }`}
                      onClick={() => !msg.read && handleMarkAsRead(msg.id)}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {msg.sender_display_name[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <Link
                              to={`/user/${msg.sender_id}`}
                              className="font-sans text-sm font-bold text-gray-900 hover:underline no-underline"
                            >
                              u/{msg.sender_display_name}
                            </Link>
                            <span className="font-sans text-xs text-gray-500 ml-2">
                              {formatTimeAgo(msg.created_at)}
                            </span>
                          </div>
                        </div>
                        {!msg.read && (
                          <span className="px-2 py-1 text-[10px] font-sans font-bold bg-blue-600 text-white rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                      <h3 className="font-sans text-sm font-bold text-gray-900 mb-2">
                        {msg.subject}
                      </h3>
                      <p className="font-sans text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {msg.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'sent' && (
              <div className="space-y-3">
                {sentMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <Send size={48} className="mx-auto text-gray-400 mb-3" />
                    <p className="font-sans text-gray-600 text-sm">No sent messages</p>
                  </div>
                ) : (
                  sentMessages.map(msg => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-md border border-gray-200 bg-white"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-sans text-xs text-gray-500">To:</span>
                        <Link
                          to={`/user/${msg.recipient_id}`}
                          className="font-sans text-sm font-bold text-gray-900 hover:underline no-underline"
                        >
                          u/{msg.recipient_display_name}
                        </Link>
                        <span className="font-sans text-xs text-gray-500 ml-auto">
                          {formatTimeAgo(msg.created_at)}
                        </span>
                      </div>
                      <h3 className="font-sans text-sm font-bold text-gray-900 mb-2">
                        {msg.subject}
                      </h3>
                      <p className="font-sans text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {msg.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'compose' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-sans text-sm font-medium text-gray-900 mb-2">
                    To (User ID)
                  </label>
                  <input
                    type="text"
                    value={recipientUserId}
                    onChange={(e) => setRecipientUserId(e.target.value)}
                    placeholder="Enter user ID"
                    className="w-full px-3 py-2 rounded border border-gray-300 bg-white font-sans text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                  <p className="font-sans text-xs text-gray-500 mt-1">
                    Get user ID from their profile URL: /user/[USER_ID]
                  </p>
                </div>

                <div>
                  <label className="block font-sans text-sm font-medium text-gray-900 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Message subject"
                    className="w-full px-3 py-2 rounded border border-gray-300 bg-white font-sans text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-sans text-sm font-medium text-gray-900 mb-2">
                    Message
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your message..."
                    className="w-full h-40 px-3 py-2 rounded border border-gray-300 bg-white font-sans text-sm text-gray-900 resize-none focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !subject.trim() || !body.trim() || !recipientUserId.trim()}
                    className="px-5 py-2 rounded-full bg-blue-600 text-white font-sans text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send size={16} />
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
