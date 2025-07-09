
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Send, Image as ImageIcon, RotateCcw, FileDown, Loader } from 'lucide-react';
import { API_BASE_URL } from '../config';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../context/ThemeContext';


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  imageUrl?: string;
  reportSummary?: string;
}

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: "👋 **Welcome to Orthopedic Assistant!**\n\nI'm here to help analyze X-ray images and provide orthopedic suggestions. You can:\n\n- Upload an X-ray image for analysis\n- Ask questions about fractures and treatments\n- Get detailed medical recommendations\n- Download analysis reports as PDF\n- Find nearby orthopedic hospitals\n\nHow can I assist you today?",
    sender: 'bot',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState<string | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleReset = () => {
    setMessages([messages[0]]);
  };

  const handleDownloadPDF = async (reportSummary: string, messageId: string, imageUrl?: string) => {
    try {
      setIsPdfLoading(messageId);

      const formData = new FormData();
      formData.append('report_md', reportSummary);

      if (imageUrl) {
        const imageResponse = await fetch(imageUrl);
        const blob = await imageResponse.blob();
        const reader = new FileReader();

        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result?.toString();
            if (result) resolve(result.split(',')[1]);
            else reject('Failed to encode image');
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        formData.append('image_base64', base64);
      }

      const response = await fetch(`${API_BASE_URL}/download_pdf`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate PDF: ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fracture_report.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Failed to download PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsPdfLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);

    setInput('');

    const endpoint = selectedFile ? '/chatimg' : '/chat';
    const formData = new FormData();
    if (input.trim()) formData.append('message', input);
    if (selectedFile) formData.append('image', selectedFile);


    const chatHistory = messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));
    formData.append('chat_history', JSON.stringify(chatHistory));


    setIsLoading(true);
    try {

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });


      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const botMessage: Message = {
        id: Date.now().toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
        reportSummary: data.report_summary || undefined,
        imageUrl: data.annotated_image_url || undefined
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Fetch error:", error);
      setMessages(prev => [...prev, {

        id: Date.now().toString(),
        text: `⚠️ **Error**\n\n${error instanceof Error ? error.message : 'Failed to get response from server.'}`,
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
      <div className="max-w-4xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Orthopedic Assistant</h2>
          <button onClick={handleReset} className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
        <div ref={chatBoxRef} className="h-[600px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
          <AnimatePresence>
            {messages.map(message => (
                <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-xl shadow-sm ${message.sender === 'user' ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'}`}>
                    <div className={`prose dark:prose-invert ${message.sender === 'user' ? 'prose-white' : ''} max-w-none`}>
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                    {message.imageUrl && (
                        <div className="mt-4">
                          <img src={message.imageUrl} alt="Annotated X-ray" className="max-w-full rounded-lg shadow-md" />
                        </div>
                    )}
                    {message.sender === 'bot' && message.reportSummary && (
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <button onClick={() => handleDownloadPDF(message.reportSummary!, message.id, message.imageUrl)} disabled={isPdfLoading === message.id} className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50">
                            {isPdfLoading === message.id ? <><Loader className="h-4 w-4 animate-spin" /><span>Generating PDF...</span></> : <><FileDown className="h-4 w-4" /><span>Download Report as PDF</span></>}
                          </button>
                        </div>
                    )}
                  </div>
                </motion.div>
            ))}
            {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex space-x-2 p-4 bg-white dark:bg-gray-800 rounded-xl w-24 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce delay-200" />
                </motion.div>
            )}
          </AnimatePresence>
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750">
          <div className="flex space-x-4">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
              <Upload className="h-6 w-6" />
            </button>
            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message..." className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm" />
            <button type="submit" disabled={isLoading} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-sm">
              <Send className="h-6 w-6" />
            </button>
          </div>
          {selectedFile && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                <ImageIcon className="h-4 w-4 mr-1" />
                {selectedFile.name}
              </div>
          )}
        </form>
      </div>
  );
};
