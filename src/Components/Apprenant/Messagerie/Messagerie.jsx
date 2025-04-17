import { useState, useCallback } from 'react';
import { Send, ChevronLeft, MoreVertical, Smile, Paperclip } from 'lucide-react';
import PropTypes from 'prop-types';

// Using placeholder image services
const currentUserImg = 'https://i.pravatar.cc/150?img=5';  // Random user avatar
const teacherImg = 'https://i.pravatar.cc/150?img=60';     // Random teacher avatar

const MessageBubble = ({ message, isCurrentUser }) => (
  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
    {!isCurrentUser && (
      <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
        <img src={teacherImg} alt="Teacher" className="w-full h-full object-cover" />
      </div>
    )}
    <div
      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isCurrentUser
          ? 'bg-blue-600 text-white rounded-tr-none'
          : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white rounded-tl-none'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-xs">
          {isCurrentUser ? 'Vous' : message.from}
        </span>
        <span className="text-xs opacity-70 ml-2">
          {new Date(message.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p className="text-sm">{message.content}</p>
    </div>
    {isCurrentUser && (
      <div className="w-10 h-10 rounded-full overflow-hidden ml-3 flex-shrink-0">
        <img src={currentUserImg} alt="You" className="w-full h-full object-cover" />
      </div>
    )}
  </div>
);

MessageBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.number.isRequired,
    from: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    read: PropTypes.bool.isRequired
  }).isRequired,
  isCurrentUser: PropTypes.bool.isRequired
};

const Messagerie = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'Prof. Martin',
      content: 'Votre projet a été approuvé. Bon travail!',
      date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      read: false
    },
    {
      id: 2,
      from: 'Prof. Martin',
      content: 'N\'oubliez pas le quiz à rendre pour demain',
      date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      read: true
    },
    {
      id: 3,
      from: 'Moi',
      content: 'Merci professeur, je vais le faire dès aujourd\'hui!',
      date: new Date(Date.now() - 82800000).toISOString(), // 23 hours ago
      read: true
    }
  ]);
  
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = useCallback((e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const newMsg = {
        id: messages.length + 1,
        from: 'Moi',
        content: newMessage,
        date: new Date().toISOString(),
        read: true
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
      
      // Simulate teacher reply after 1-3 seconds
      if (Math.random() > 0.3) { // 70% chance of reply
        setTimeout(() => {
          const replies = [
            "Je l'ai reçu, merci!",
            "Très bonne réponse!",
            "Pouvez-vous développer?",
            "Exactement!",
            "Je vous répondrai demain."
          ];
          const replyMsg = {
            id: messages.length + 2,
            from: 'Prof. Martin',
            content: replies[Math.floor(Math.random() * replies.length)],
            date: new Date().toISOString(),
            read: false
          };
          setMessages(prev => [...prev, replyMsg]);
        }, 1000 + Math.random() * 2000);
      }
    }
  }, [newMessage, messages]);

  const unreadCount = messages.filter(m => !m.read && m.from !== 'Moi').length;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white dark:bg-slate-800 rounded-lg shadow-lg">
      {/* Chat header */}
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-t-lg">
        <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
          <img src={teacherImg} alt="Teacher" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-800 dark:text-white">Prof. Martin</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount} message(s) non lu(s)` : 'En ligne'}
          </p>
        </div>
        <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-white">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-slate-900/30">
        {messages.sort((a,b) => new Date(a.date) - new Date(b.date)).map(msg => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            isCurrentUser={msg.from === 'Moi'} 
          />
        ))}
      </div>

      {/* Message input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-lg">
        <div className="flex items-center">
          <button type="button" className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-white">
            <Paperclip size={20} />
          </button>
          <button type="button" className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-white">
            <Smile size={20} />
          </button>
          <input
            type="text"
            className="flex-1 mx-2 p-2 border border-gray-300 rounded-full dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="Écrivez un message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            required
          />
          <button 
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!newMessage.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Messagerie;