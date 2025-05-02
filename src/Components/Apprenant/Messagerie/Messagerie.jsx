import { useState, useCallback, useRef } from 'react';
import { Send, MoreVertical, Search, Menu, Smile, Paperclip, X } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const Messagerie = () => {
  // Sample data
  const onlineFormateurs = [
    { id: 1, name: 'Prof. Martin', avatar: 'https://i.pravatar.cc/150?img=60', status: 'online' },
    { id: 2, name: 'Dr. Sophie', avatar: 'https://i.pravatar.cc/150?img=45', status: 'online' },
    { id: 3, name: 'Prof. Ahmed', avatar: 'https://i.pravatar.cc/150?img=30', status: 'online' }
  ];

  const allConversations = [
    {
      id: 1,
      name: 'Prof. Martin',
      avatar: 'https://i.pravatar.cc/150?img=60',
      lastMessage: 'Votre projet a été approuvé',
      time: '40 min',
      unread: 2,
      type: 'text'
    },
    {
      id: 2,
      name: 'Souba Moujahed',
      avatar: 'https://i.pravatar.cc/150?img=8',
      lastMessage: 'a envoyé une pièce jointe',
      time: '40 min',
      unread: 0,
      type: 'file'
    },
    {
      id: 3,
      name: 'Youssef Suidi',
      avatar: 'https://i.pravatar.cc/150?img=12',
      lastMessage: 'transport covoiturage H hora : 2 h',
      time: '2 h',
      unread: 1,
      type: 'text'
    },
    {
      id: 4,
      name: 'K&D',
      avatar: 'https://i.pravatar.cc/150?img=15',
      lastMessage: 'taha a envoyé une pièce jointe',
      time: '6 h',
      unread: 0,
      type: 'file'
    },
    {
      id: 5,
      name: 'melek',
      avatar: 'https://i.pravatar.cc/150?img=20',
      lastMessage: 'a envoyé une pièce jointe',
      time: '8 h',
      unread: 0,
      type: 'file'
    }
  ];

  const initialMessages = {
    1: [
      { id: 1, sender: 'Prof. Martin', content: 'Bonjour, comment allez-vous?', time: '11:20', isMe: false },
      { id: 2, sender: 'Moi', content: 'Je vais bien merci! Et vous?', time: '11:22', isMe: true },
      { id: 3, sender: 'Prof. Martin', content: 'Votre projet a été approuvé', time: '11:30', isMe: false }
    ],
    2: [
      { id: 1, sender: 'Souba Moujahed', content: 'Pièce jointe: document.pdf', time: '40 min', isMe: false, isFile: true }
    ],
    3: [
      { id: 1, sender: 'Youssef Suidi', content: 'transport covoiturage H hora : 2 h', time: '2 h', isMe: false }
    ]
  };

  // State
  const [activeConversation, setActiveConversation] = useState(1);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Handlers
  const sendMessage = useCallback((e) => {
    e.preventDefault();
    if (newMessage.trim() || selectedFile) {
      const newMsg = {
        id: messages[activeConversation].length + 1,
        sender: 'Moi',
        content: selectedFile ? `Pièce jointe: ${selectedFile.name}` : newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        isFile: !!selectedFile
      };
      
      setMessages(prev => ({
        ...prev,
        [activeConversation]: [...prev[activeConversation], newMsg]
      }));
      
      setNewMessage('');
      setSelectedFile(null);
      
      // Simulate reply
      setTimeout(() => {
        const replies = [
          "Merci pour l'information",
          "Je vais vérifier cela",
          "Pouvez-vous m'en dire plus?",
          "Excellente question!",
          "Je vous réponds dès que possible"
        ];
        const replyMsg = {
          id: messages[activeConversation].length + 2,
          content: replies[Math.floor(Math.random() * replies.length)],
          sender: allConversations.find(c => c.id === activeConversation)?.name || '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: false
        };
        setMessages(prev => ({
          ...prev,
          [activeConversation]: [...prev[activeConversation], replyMsg]
        }));
      }, 1000 + Math.random() * 2000);
    }
  }, [newMessage, activeConversation, messages, selectedFile]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const filteredConversations = allConversations.filter(conv => 
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-slate-800">
          <div className="flex items-center">
            <h2 className="font-semibold text-gray-800 dark:text-white">Messages</h2>
          </div>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-white">
            <MoreVertical size={20} />
          </button>
        </div>
        
        {/* Online formateurs */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-800">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {onlineFormateurs.map(formateur => (
              <div 
                key={formateur.id} 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => setActiveConversation(formateur.id)}
              >
                <div className="relative">
                  <img
                    src={formateur.avatar}
                    alt={formateur.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                </div>
                <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">{formateur.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Search */}
        <div className="p-2 border-b border-gray-200 dark:border-slate-800">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Rechercher des messages"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(conv => (
            <div
              key={conv.id}
              className={`flex items-center p-3 border-b border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 ${
                activeConversation === conv.id ? 'bg-blue-50 dark:bg-slate-700' : ''
              }`}
              onClick={() => setActiveConversation(conv.id)}
            >
              <div className="relative mr-3">
                <img
                  src={conv.avatar}
                  alt={conv.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {conv.unread > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {conv.unread}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-800 dark:text-white truncate">{conv.name}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{conv.time}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {conv.type === 'file' ? (
                    <span className="flex items-center">
                      <Paperclip size={12} className="mr-1" />
                      {conv.lastMessage}
                    </span>
                  ) : conv.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-slate-800">
          <div className="flex items-center">
            <img
              src={allConversations.find(c => c.id === activeConversation)?.avatar || ''}
              alt="Profile"
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <h3 className="font-medium text-gray-800 dark:text-white">
                {allConversations.find(c => c.id === activeConversation)?.name || ''}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {onlineFormateurs.some(f => f.id === activeConversation) ? 'En ligne' : 'Hors ligne'}
              </p>
            </div>
          </div>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-white">
            <MoreVertical size={20} />
          </button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-slate-900/30">
          {messages[activeConversation]?.map(msg => (
            <div
              key={msg.id}
              className={`flex mb-4 ${msg.isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!msg.isMe && (
                <img
                  src={allConversations.find(c => c.id === activeConversation)?.avatar || ''}
                  alt="Profile"
                  className="w-8 h-8 rounded-full mr-2 mt-1"
                />
              )}
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.isMe
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white rounded-tl-none shadow'
                }`}
              >
                {msg.isFile ? (
                  <div className="flex items-center">
                    <Paperclip size={16} className="mr-2" />
                    <span>{msg.content}</span>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
                <p className="text-xs text-right mt-1 opacity-70">
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Message input */}
        <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 relative">
          {selectedFile && (
            <div className="flex items-center justify-between mb-2 p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
              <span className="text-sm truncate flex-1">{selectedFile.name}</span>
              <button 
                type="button" 
                onClick={() => setSelectedFile(null)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          <div className="flex items-center">
            <div className="relative">
              <button 
                type="button" 
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-white"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile size={20} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-10">
                  <Picker 
                    data={data} 
                    onEmojiSelect={addEmoji} 
                    theme={localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'}
                  />
                </div>
              )}
            </div>
            
            <button 
              type="button" 
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-white"
              onClick={() => fileInputRef.current.click()}
            >
              <Paperclip size={20} />
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
              />
            </button>
            
            <input
              type="text"
              className="flex-1 mx-2 p-2 border border-gray-300 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-700"
              placeholder="Écrivez un message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              required={!selectedFile}
            />
            
            <button
              type="submit"
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
              disabled={!newMessage.trim() && !selectedFile}
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Messagerie;