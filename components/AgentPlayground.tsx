
import React, { useState, useRef, useEffect } from 'react';
import { Agent, ChatMessage } from '../types';
import { X, Send, Bot, Paperclip, Mic, FileText, Square, Loader2 } from './ui/Icons';
import { getAgentResponse } from '../services/agentResponseService';
import { useNotification } from '../context/NotificationContext';

interface AgentPlaygroundProps {
  agent: Agent;
  onClose: () => void;
}

interface Attachment {
  file: File;
  url: string;
  type: 'image' | 'audio' | 'file';
}

const MAX_FILE_SIZE = 64 * 1024 * 1024; // 64MB
const MAX_RECORDING_TIME = 60; // 60 segundos

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

const AgentPlayground: React.FC<AgentPlaygroundProps> = ({ agent, onClose }) => {
  const { addNotification } = useNotification();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', parts: [{ text: `Olá! Sou ${agent.name}. Como posso ajudar?` }] }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTypingLength, setCurrentTypingLength] = useState<number | null>(null);
  
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, currentTypingLength, attachments.length]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files) as File[];
    const oversized = filesArray.some((f: File) => f.size > MAX_FILE_SIZE);
    if (oversized) {
        addNotification('error', 'Arquivo muito grande', 'O limite de anexo é de 64MB por arquivo.');
        return;
    }
    const newAttachments: Attachment[] = filesArray.map((file: File) => ({
        file,
        url: URL.createObjectURL(file),
        type: (file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file') as 'image' | 'audio' | 'file'
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const file = new File([audioBlob], 'audio_message.webm', { type: 'audio/webm' });
            if (file.size <= MAX_FILE_SIZE) {
                setAttachments(prev => [...prev, { file, url: URL.createObjectURL(audioBlob), type: 'audio' }]);
            }
            stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        addNotification('error', 'Erro no microfone', 'Acesso negado.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && attachments.length === 0) || isLoading) return;
    
    const parts: any[] = [];
    if (inputValue.trim()) parts.push({ text: inputValue });
    setIsLoading(true);
    
    for (const att of attachments) {
        const base64Data = await fileToBase64(att.file);
        parts.push({ inlineData: { mimeType: att.file.type, data: base64Data } });
    }
    
    const userMsgObj: ChatMessage = { role: 'user', parts };
    const historyWithUser = [...messages, userMsgObj];
    setMessages(historyWithUser);
    setInputValue('');
    setAttachments([]);

    try {
        const responseText = await getAgentResponse(agent, historyWithUser);
        const bubbles = responseText.split('\n\n').filter(f => f.trim() !== '');

        for (const bubbleText of bubbles) {
            setCurrentTypingLength(bubbleText.length);
            
            // VELOCIDADE ULTRA RÁPIDA
            const typingDelay = Math.min(
                8000, 
                Math.max(600, bubbleText.length * (8 + Math.floor(Math.random() * 7)))
            );

            await new Promise(resolve => setTimeout(resolve, typingDelay));
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: bubbleText }] }]);
            setCurrentTypingLength(null);
        }
    } catch (err: any) {
        addNotification('error', 'Erro na Resposta', err.message);
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Erro ao processar." }] }]);
    } finally {
        setIsLoading(false);
        setCurrentTypingLength(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const actionBtnBase = "w-[38px] h-[38px] rounded-lg flex items-center justify-center transition-all transform active:scale-95 shadow-sm";
  const secondaryBtnStyle = `${actionBtnBase} bg-muted text-muted-foreground hover:bg-accent hover:text-foreground`;

  return (
    <div className={`fixed bottom-4 right-4 w-[360px] max-w-[calc(100vw-32px)] h-[550px] bg-card border border-border shadow-xl rounded-lg flex flex-col font-sans z-50 overflow-hidden animate-fade-in`}>
      <div className={`px-4 py-3 border-b border-border bg-card flex justify-between items-center shrink-0`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 border border-border bg-muted text-muted-foreground rounded flex items-center justify-center shrink-0`}>
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className={`font-semibold text-sm truncate text-foreground`}>{agent.name}</span>
            {agent.maintenance && (
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Em Manutenção</span>
            )}
          </div>
        </div>
        <button onClick={onClose} className={`transition-colors shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted`}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-background`}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end animate-fade-in`}>
              <div className={`max-w-[85%] text-sm leading-relaxed shadow-sm flex flex-col gap-2 overflow-hidden ${isUser ? 'items-end' : 'items-start'}`}>
                {msg.parts.map((part, pIdx) => (
                    part.text ? (
                        <div key={pIdx} className={`px-3 py-2 whitespace-pre-wrap ${isUser ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm' : 'bg-card border border-border text-foreground rounded-2xl rounded-bl-sm'}`}>
                            {part.text.trim()}
                        </div>
                    ) : part.inlineData ? (
                        <div key={pIdx} className="max-w-full">
                            {part.inlineData.mimeType.startsWith('image/') ? (
                                <img src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} className="max-w-full rounded-lg border border-border object-cover max-h-[200px]" />
                            ) : part.inlineData.mimeType.startsWith('audio/') ? (
                                <audio controls src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} className="max-w-full h-10" />
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground">
                                    <FileText className="w-4 h-4" /> <span className="text-xs truncate">Arquivo</span>
                                </div>
                            )}
                        </div>
                    ) : null
                ))}
              </div>
            </div>
          );
        })}
        
        {currentTypingLength !== null && (
            <div className="flex justify-start items-end animate-fade-in">
                <div 
                    className="bg-card border border-border rounded-2xl rounded-bl-sm shadow-sm p-3 animate-pulse flex flex-col gap-2"
                    style={{ width: `${Math.min(240, Math.max(100, currentTypingLength * 0.6))}px` }}
                >
                    <div className="h-1.5 bg-muted rounded-full w-full"></div>
                    {currentTypingLength > 50 && <div className="h-1.5 bg-muted rounded-full w-[85%]"></div>}
                </div>
            </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="m-0 border-t border-border bg-card flex flex-col shrink-0">
        {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-border bg-muted/40 max-h-[100px] overflow-y-auto">
                {attachments.map((att, idx) => (
                    <div key={idx} className="relative w-12 h-12 rounded-lg border border-border bg-card shadow-sm overflow-hidden group">
                        {att.type === 'image' ? <img src={att.url} className="w-full h-full object-cover" /> :
                         att.type === 'audio' ? <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground"><Mic className="w-5 h-5"/></div> :
                         <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground"><FileText className="w-5 h-5"/></div>}
                        <button type="button" onClick={() => removeAttachment(idx)} className="absolute -top-1 -right-1 bg-foreground text-background rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        )}

        <div className="px-3 py-3 flex gap-2 items-end">
            {isRecording ? (
                <div className="flex-1 h-[50px] bg-muted/50 text-foreground rounded-lg flex items-center justify-between px-4 border border-border animate-fade-in">
                   <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-foreground/70 animate-pulse"></div>
                       <span className="text-sm font-bold tracking-widest">{Math.floor(recordingTime/60).toString().padStart(2,'0')}:{(recordingTime%60).toString().padStart(2,'0')}</span>
                   </div>
                   <button type="button" onClick={stopRecording} className="p-1 hover:bg-accent rounded text-foreground transition-colors">
                       <Square className="w-4 h-4 fill-current" />
                   </button>
                </div>
            ) : (
                <>
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="flex-1 border border-input rounded-lg px-3 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-background text-foreground placeholder:text-muted-foreground resize-none block min-h-[50px] scrollbar-hide"
                        placeholder="Digite sua mensagem..."
                        style={{ height: '18px' }}
                        disabled={isLoading}
                    />
                    <div className="flex items-center gap-1.5 shrink-0 h-[50px]">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className={secondaryBtnStyle} title="Anexar">
                            <Paperclip className="w-4 h-4" />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,audio/*,.pdf,.doc,.docx,.txt" onChange={handleFileSelect} />
                        <button type="button" onClick={startRecording} className={secondaryBtnStyle} title="Áudio">
                            <Mic className="w-4 h-4" />
                        </button>
                        <button type="submit" disabled={isLoading || (!inputValue.trim() && attachments.length === 0)} className={`${actionBtnBase} bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed`} title="Enviar">
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </div>
                </>
            )}
        </div>
      </form>
    </div>
  );
};

export default AgentPlayground;


