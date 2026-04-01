/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Cpu, Loader2, User, Bot, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
      });

      const text = response.text;
      if (text) {
        setMessages(prev => [...prev, { role: 'model', content: text }]);
      } else {
        throw new Error("No response received from Gemini.");
      }
    } catch (err) {
      console.error("Gemini Error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-semibold text-lg tracking-tight">NX-AI</h1>
        </div>
        <button 
          onClick={clearChat}
          className="text-slate-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-slate-100"
          title="Clear chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6" ref={scrollRef}>
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
              <Cpu className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Welcome to NX-AI</h2>
            <p className="text-slate-500">
              Your intelligent companion for coding, analysis, and creative exploration.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full pt-4">
              {['Explain quantum computing', 'Write a poem about rain', 'Help me debug a Python script'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                  }}
                  className="text-left px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-medium text-slate-700"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-200'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-slate-600" />}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  <div className="markdown-body prose prose-slate max-w-none prose-sm md:prose-base">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center animate-pulse">
              <Bot className="w-5 h-5 text-slate-400" />
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span className="text-slate-500 text-sm font-medium">Gemini is thinking...</span>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm max-w-md mx-auto text-center">
            {error}
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-4 md:p-6 bg-white border-t border-slate-200">
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto relative flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="w-full bg-slate-100 border-none rounded-2xl px-6 py-4 pr-14 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-semibold">
          Powered by Gemini 3 Flash
        </p>
      </footer>
    </div>
  );
}
