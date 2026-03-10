import React, { useState, useEffect, useRef } from 'react';
import { supportChatService, SupportMessage, SupportAttachment, getAttachmentUrl } from '../services/supportChatService';
import { Send, Paperclip, Bot, FileText, X, Mic, Square, Loader2, Search, ArrowDown, ChevronDown, Headset } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioPlayer from '../components/ui/AudioPlayer';
import { UserProfile } from '../types';

const MAX_FILE_SIZE = 64 * 1024 * 1024; // 64MB
const MAX_RECORDING_TIME = 60; // 60 seconds

const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64String = result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
};

const SupportChat: React.FC = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<SupportAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
        const saved = localStorage.getItem('ebettr_user_cache');
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
  });

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesRef = useRef<SupportMessage[]>([]);
  
  useEffect(() => {
      messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setUnreadCount(0);
    setShowScrollButton(false);
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShowScrollButton(!isNearBottom);
    if (isNearBottom) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 5 seconds
    const intervalId = setInterval(() => {
      fetchMessages(true, messagesRef.current); // Pass true to indicate polling (silent update)
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Initial scroll to bottom when messages first load
  useEffect(() => {
    if (messages.length > 0 && !isLoading && !showScrollButton) {
        // Only auto-scroll if we are already near bottom or it's the first load
        // But since we don't track "first load" explicitly here, we can check if unreadCount is 0
        if (unreadCount === 0) {
            scrollToBottom(false);
        }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  // Recording timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
        interval = setInterval(() => {
            setRecordingTime(t => {
                if (t >= MAX_RECORDING_TIME - 1) {
                    stopRecording();
                    return MAX_RECORDING_TIME;
                }
                return t + 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const fetchMessages = async (isPolling = false, currentMessages: SupportMessage[] = []) => {
    if (!isPolling) setIsLoading(true);
    try {
      let options: { limit?: number; after?: string } = { limit: 50 };
      
      const msgsToUse = isPolling ? currentMessages : messages;

      if (isPolling && msgsToUse.length > 0) {
          // Find the most recent timestamp to fetch only new messages
          const latestMessage = msgsToUse.reduce((latest, current) => {
              if (!latest.timestamp) return current;
              if (!current.timestamp) return latest;
              return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
          }, msgsToUse[0]);
          
          if (latestMessage && latestMessage.timestamp) {
              options = { limit: 50, after: latestMessage.timestamp };
          }
      }

      const data = await supportChatService.getMessages(options);
      
      if (Array.isArray(data)) {
          if (isPolling) {
              // Only append new messages if we received any
              if (data.length > 0) {
                  setMessages(prev => {
                      // Filter out any duplicates just in case
                      const existingIds = new Set(prev.map(m => m.id));
                      const newMessages = data.filter(m => !existingIds.has(m.id));
                      
                      if (newMessages.length > 0) {
                          // Check if user is near bottom
                          if (messagesContainerRef.current) {
                              const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
                              const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
                              
                              if (!isNearBottom) {
                                  setUnreadCount(prevCount => prevCount + newMessages.length);
                                  setShowScrollButton(true);
                              } else {
                                  // If near bottom, we'll auto-scroll in the useEffect
                              }
                          }
                      }
                      
                      return [...prev, ...newMessages];
                  });
              }
          } else {
              setMessages(data);
              // Reset scroll state on full reload
              setTimeout(() => scrollToBottom(false), 100);
          }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      
      for (const file of filesArray) {
        if (file.size > MAX_FILE_SIZE) {
            alert(`Arquivo ${file.name} muito grande. Limite de 64MB.`);
            continue;
        }

        const base64Data = await fileToBase64(file);
        
        const newAttachment: SupportAttachment = {
          dataBase64: base64Data,
          filename: file.name,
          mimeType: file.type,
          // Temporary URL for preview
          url: URL.createObjectURL(file),
          type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file'
        };

        setAttachments(prev => [...prev, newAttachment]);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const file = new File([audioBlob], 'audio_message.webm', { type: 'audio/webm' });
            
            const base64Data = await fileToBase64(file);
            
            const newAttachment: SupportAttachment = {
                dataBase64: base64Data,
                filename: 'audio_message.webm',
                mimeType: 'audio/webm',
                url: URL.createObjectURL(audioBlob),
                type: 'audio'
            };
            
            setAttachments(prev => [...prev, newAttachment]);
            stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
        setIsRecording(true);
        setRecordingTime(0);
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Erro ao acessar microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const content = newMessage.trim();
    const currentAttachments = [...attachments];
    
    if (!content && currentAttachments.length === 0) return;

    // Clear input immediately for better UX
    setNewMessage('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = '50px';
    }

    setIsSending(true);
    try {
      const attachmentsToSend = currentAttachments.map(({ url, type, ...rest }) => rest);

      const payload = {
        content: content,
        attachments: attachmentsToSend,
      };

      const response = await supportChatService.sendMessage(payload, currentUser?.name);
      
      setMessages((prev) => [...prev, response.message]);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const actionBtnBase = "w-[38px] h-[38px] rounded-lg flex items-center justify-center transition-all transform active:scale-95 shadow-sm";
  const secondaryBtnStyle = `${actionBtnBase} bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full font-sans">
      {/* System Header */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 pt-8 px-6 shrink-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-gray-700 rounded-lg flex items-center justify-center text-gray-100 bg-gray-800 shadow-sm">
               <Headset className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                    Suporte ao Cliente
                </h1>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 font-light">
                Converse com nossa equipe para tirar dúvidas ou relatar problemas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm m-6 mt-6 relative">
        {/* Messages Area */}
        <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 scroll-smooth"
        >
          {isLoading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Bot className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium">Nenhuma mensagem ainda. Inicie a conversa!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} items-end`}
              >
                <div
                  className={`max-w-[85%] text-[15px] leading-relaxed shadow-sm flex flex-col gap-2 overflow-hidden ${
                    msg.isUser
                      ? 'items-end'
                      : 'items-start'
                  }`}
                >
                  <div className={`px-4 py-3 whitespace-pre-wrap ${
                      msg.isUser 
                          ? 'bg-gray-900 text-white rounded-2xl rounded-br-sm border border-gray-800' 
                          : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-sm'
                  }`}>
                      {/* Author Name */}
                      {(msg.author || msg.isUser) && (
                      <p className={`text-xs font-bold mb-1.5 ${msg.isUser ? 'text-white/70' : 'text-gray-500'}`}>
                          {msg.author || (msg.isUser ? (currentUser?.name || 'Cliente') : 'Suporte')}
                      </p>
                      )}

                      {msg.content && <p className="tracking-tight">{msg.content}</p>}
                      
                      {/* Attachments Display */}
                      {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 space-y-2.5">
                          {msg.attachments.map((att, idx) => (
                          <div key={idx} className="max-w-full">
                              {att.type === 'image' || (att.mimeType && att.mimeType.startsWith('image/')) ? (
                                  <a href={getAttachmentUrl(att.url, att.dataBase64, att.mimeType)} target="_blank" rel="noopener noreferrer" className="block relative group rounded-xl overflow-hidden border border-black/10">
                                      <img 
                                          src={getAttachmentUrl(att.url, att.dataBase64, att.mimeType)} 
                                          alt={att.filename}
                                          className="max-w-full object-cover max-h-[280px] transition-transform duration-500 group-hover:scale-105" 
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                          <div className="bg-white/90 p-2 rounded-full shadow-sm backdrop-blur-sm text-gray-900">
                                              <Search className="w-4 h-4" />
                                          </div>
                                      </div>
                                  </a>
                              ) : att.type === 'audio' || (att.mimeType && att.mimeType.startsWith('audio/')) ? (
                                  <AudioPlayer 
                                      src={getAttachmentUrl(att.url, att.dataBase64, att.mimeType)} 
                                      className="w-full max-w-[280px]" 
                                      variant={msg.isUser ? 'inverted' : 'default'}
                                  />
                              ) : (
                                  <a 
                                      href={getAttachmentUrl(att.url, att.dataBase64, att.mimeType)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                                      msg.isUser ? 'border-white/20 hover:bg-white/10 text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-800'
                                      } ${!att.url && !att.dataBase64 ? 'cursor-default pointer-events-none' : ''}`}
                                  >
                                      <div className={`p-2 rounded-lg shrink-0 ${msg.isUser ? 'bg-white/10' : 'bg-gray-100 border border-gray-200'}`}>
                                          <FileText className="w-4 h-4" />
                                      </div>
                                      <div className="flex flex-col overflow-hidden">
                                          <span className="text-sm font-medium truncate">{att.filename}</span>
                                          <span className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${msg.isUser ? 'text-white/60' : 'text-gray-400'}`}>Documento</span>
                                      </div>
                                  </a>
                              )}
                          </div>
                          ))}
                      </div>
                      )}

                      {/* Timestamp */}
                      {msg.timestamp && (
                      <p className={`text-[10px] mt-2 text-right font-medium ${msg.isUser ? 'text-white/50' : 'text-gray-400'}`}>
                          {formatTime(msg.timestamp)}
                      </p>
                      )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
            <button
                onClick={() => scrollToBottom()}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 bg-white border border-gray-200 rounded-full px-4 py-1.5 flex items-center gap-1.5 hover:bg-gray-50 transition-none group"
            >
                {unreadCount > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500">
                    {unreadCount > 0 
                        ? (unreadCount === 1 ? '1 Nova mensagem' : `${unreadCount} Novas mensagens`)
                        : 'Ver novas'
                    }
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 mb-0.4" />
            </button>
        )}

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="m-0 border-t border-gray-200 bg-white flex flex-col shrink-0 rounded-b-xl">
          {/* Attachments Preview */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50 max-h-[120px] overflow-y-auto"
              >
                {attachments.map((att, index) => (
                  <div key={index} className="relative w-14 h-14 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden group">
                     {att.type === 'image' ? (
                         <img src={att.url} className="w-full h-full object-cover" alt="preview" />
                     ) : att.type === 'audio' ? (
                         <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500"><Mic className="w-5 h-5"/></div>
                     ) : (
                         <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-500"><FileText className="w-5 h-5"/></div>
                     )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-4 py-4 flex gap-3 items-end">
              {isRecording ? (
                  <div className="flex-1 h-[50px] bg-red-50 text-red-600 rounded-lg flex items-center justify-between px-4 border border-red-100 animate-pulse">
                     <div className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></div>
                         <span className="text-sm font-bold tracking-widest">{Math.floor(recordingTime/60).toString().padStart(2,'0')}:{(recordingTime%60).toString().padStart(2,'0')}</span>
                     </div>
                     <button type="button" onClick={stopRecording} className="p-1.5 hover:bg-red-100 rounded-md text-red-700 transition-colors">
                         <Square className="w-4 h-4 fill-current" />
                     </button>
                  </div>
              ) : (
                  <>
                      <textarea
                          ref={textareaRef}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={handleKeyDown}
                          rows={1}
                          className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 bg-gray-50 hover:bg-white transition-colors placeholder-gray-400 resize-none block min-h-[50px] scrollbar-hide shadow-sm"
                          placeholder="Digite sua mensagem..."
                          style={{ height: '50px' }}
                      />
                      <div className="flex items-center gap-2 shrink-0 h-[50px]">
                          <button 
                              type="button" 
                              onClick={() => fileInputRef.current?.click()} 
                              className={secondaryBtnStyle} 
                              title="Anexar"
                          >
                              <Paperclip className="w-4 h-4" />
                          </button>
                          <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              multiple 
                              accept="image/*,audio/*,.pdf,.doc,.docx,.txt" 
                              onChange={handleFileChange} 
                          />
                          <button 
                              type="button" 
                              onClick={startRecording} 
                              className={secondaryBtnStyle} 
                              title="Gravar Áudio"
                          >
                              <Mic className="w-4 h-4" />
                          </button>
                          <button 
                              type="submit" 
                              disabled={isSending || (!newMessage.trim() && attachments.length === 0)} 
                              className={`${actionBtnBase} bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`} 
                              title="Enviar"
                          >
                              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                          </button>
                      </div>
                  </>
              )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupportChat;
