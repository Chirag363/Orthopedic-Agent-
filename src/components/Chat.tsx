import { AnimatePresence, motion } from 'framer-motion';
import { Image as ImageIcon, Send, Upload } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  imageUrl?: string;
}

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: "👋 I'm here to help analyze X-ray images and provide orthopedic suggestions. Upload an image or ask your query.",
    sender: 'bot',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const formData = new FormData();
    if (input.trim()) formData.append('message', input);
    if (selectedFile) formData.append('image', selectedFile);

    setIsLoading(true);
    setSelectedFile(null);

    try {
      const res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.response || data.annotated_image_url) {
        const botMessage: Message = {
          id: Date.now().toString() + '-bot',
          text: data.response || '',
          sender: 'bot',
          timestamp: new Date(),
          imageUrl: data.annotated_image_url
        };
        setMessages(prev => [...prev, botMessage]);
      } else if (data.error) {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '-error',
          text: `⚠ Error: ${data.error}`,
          sender: 'bot',
          timestamp: new Date()
        }]);
      }

    } catch (error) {
      console.error("Fetch error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-fetch-error',
        text: "⚠ Failed to connect to the server.",
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
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-[700px]">
      <div
        ref={chatBoxRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-xl ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {message.text && message.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                ) : message.text && message.sender === 'bot' ? (
                  <div className="prose prose-sm dark:prose-invert">
                    <ReactMarkdown>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                ) : null}

                {message.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={`http://localhost:5000${message.imageUrl}`}
                      alt="Annotated X-ray"
                      className="max-w-xs h-auto rounded-md"
                      onLoad={() => {
                        if (chatBoxRef.current) {
                           chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex space-x-2 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl w-24"
            >
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex space-x-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          >
            <Upload className="h-6 w-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
        {selectedFile && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <ImageIcon className="inline-block h-4 w-4 mr-1" />
            {selectedFile.name}
          </div>
        )}
      </form>
    </div>
  );
};