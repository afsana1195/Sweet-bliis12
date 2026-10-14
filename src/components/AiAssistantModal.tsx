import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, ShoppingBag, ArrowRight, Bot, User } from 'lucide-react';
import { CakeProduct, PRODUCTS } from '../data/bakeryData.ts';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: CakeProduct) => void;
  onAddToCart: (product: CakeProduct) => void;
  onStartCustomOrder: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  suggestedProducts?: CakeProduct[];
  customCakeIdea?: string;
  quickOptions?: string[];
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onAddToCart,
  onStartCustomOrder,
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialGreeting: ChatMessage = {
    id: 'msg-init',
    sender: 'ai',
    text: "Hello! I'm your Sweet Bliss AI Assistant. 🍰 I'm here to help you discover the perfect artisan cake for your celebration, match dietary needs, or craft a bespoke tiered design. How can I sweeten your day?",
    quickOptions: [
      'Birthday cake for 15 guests',
      'Romantic anniversary cake under ₹1000',
      '100% Eggless chocolate truffle',
      'Custom tiered wedding cake',
    ],
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: messages.map((m) => ({ role: m.sender, content: m.text })),
        }),
      });

      const data = await response.json();

      // Match suggestedProductIds with real PRODUCTS
      const matchedCakes: CakeProduct[] = [];
      if (data.suggestedProductIds && Array.isArray(data.suggestedProductIds)) {
        data.suggestedProductIds.forEach((id: string) => {
          const found = PRODUCTS.find((p) => p.id === id);
          if (found) matchedCakes.push(found);
        });
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || "I'd love to help you celebrate! Here are our recommended cakes.",
        suggestedProducts: matchedCakes.length > 0 ? matchedCakes : undefined,
        customCakeIdea: data.customCakeIdea || undefined,
        quickOptions: data.quickOptions || ['Explore All Cakes', 'Custom Cake Order'],
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error fetching AI response:', err);
      const lower = textToSend.toLowerCase().trim();
      let fallbackText = "Our signature Belgian Chocolate Truffle and Pastel Rose Dream cakes are crowd favorites! How many people are you hosting?";
      let fallbackProducts = [PRODUCTS[0], PRODUCTS[4]];
      let fallbackOptions = ['For 5-8 people', 'For 15-20 people', 'Start Custom Order'];

      if (lower.includes('हाय') || lower === 'hi' || lower === 'hello' || lower.includes('हेलो')) {
        fallbackText = "हेलो और नमस्ते! 🍰 Sweet Bliss Bakery में आपका हार्दिक स्वागत है। आज आप किस खास मौके (बर्थडे, एनिवर्सरी, पार्टी) के लिए केक तलाश रहे हैं?";
        fallbackProducts = [PRODUCTS[0], PRODUCTS[1], PRODUCTS[4]];
        fallbackOptions = ['Birthday Cakes', 'Anniversary Specials', '100% Eggless Cakes'];
      } else if (lower.includes('गुड मॉर्निंग') || lower.includes('good morning')) {
        fallbackText = "गुड मॉर्निंग जी! ☀️ आपका दिन मंगलमय और मिठास भरा हो। आज हम आपके लिए कौन सा ताज़ा बेक्ड सेलिब्रेशन केक तैयार करें?";
        fallbackProducts = [PRODUCTS[0], PRODUCTS[4]];
        fallbackOptions = ['Fresh Fruit Cake', 'Belgian Chocolate', 'Pastel Rose Dream'];
      } else if (lower.includes('गुड नाइट') || lower.includes('good night')) {
        fallbackText = "शुभ रात्रि (Good Night)! 🌙 मीठे सपनों के साथ स्वीट ब्लिस से जुड़ने के लिए धन्यवाद। कल सुबह की डिलीवरी के लिए आप अभी भी प्री-ऑर्डर कर सकते हैं!";
      } else if (lower.includes('हाउ आर यू') || lower.includes('how are you')) {
        fallbackText = "मैं बहुत बढ़िया और आपके लिए मीठी खुशियाँ तलाशने को पूरी तरह तैयार हूँ! 😊 आप कैसे हैं?";
      } else if (lower.includes('फाइन') || lower === 'fine') {
        fallbackText = "यह जानकर बहुत खुशी हुई! आइए आपके सेलिब्रेशन के लिए सबसे पसंदीदा केक चुनते हैं।";
      } else if (lower.includes('डिलीवरी टाइम') || lower.includes('delivery time')) {
        fallbackText = "हम पूरे शहर में 2 से 4 घंटे के अंदर सुपर-फास्ट और सेफ सेम-डे डिलीवरी करते हैं! 🚚📦 आप अपना मनपसंद टाइम स्लॉट भी चुन सकते हैं।";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: fallbackText,
          suggestedProducts: fallbackProducts,
          quickOptions: fallbackOptions,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#FFF9F9] rounded-3xl max-w-2xl w-full h-[620px] max-h-[92vh] flex flex-col shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Cute Mascot */}
        <div className="bg-gradient-to-r from-[#881337] via-[#9F1239] to-[#881337] text-white p-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/80 shadow-xs shrink-0 bg-white">
              <img
                src="/src/assets/images/ai_baker_assistant_1791733180129.jpg"
                alt="Chef Bliss Mascot"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold leading-tight">Sweet Bliss AI Assistant</h3>
                <span className="bg-rose-400/30 text-rose-100 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rose-300/30">
                  Online
                </span>
              </div>
              <p className="text-xs text-rose-100 font-normal">
                Your personal bakery assistant
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.sender === 'user'
                      ? 'bg-[#881337] text-white'
                      : 'bg-rose-100 text-[#881337] border border-rose-200'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#881337] text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-stone-800 rounded-tl-xs border border-rose-100 shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Embedded Cake Product Recommendations */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-rose-100 space-y-2.5">
                      <p className="text-[11px] font-bold text-[#881337] uppercase tracking-wider">
                        Recommended from Catalogue:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {msg.suggestedProducts.map((p) => (
                          <div
                            key={p.id}
                            className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-2.5 flex gap-2.5 items-center hover:bg-rose-100/60 transition-colors"
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-12 h-12 rounded-lg object-cover shrink-0 cursor-pointer"
                              onClick={() => {
                                onSelectProduct(p);
                                onClose();
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4
                                onClick={() => {
                                  onSelectProduct(p);
                                  onClose();
                                }}
                                className="font-serif text-xs font-bold text-stone-900 truncate hover:text-[#881337] cursor-pointer"
                              >
                                {p.name}
                              </h4>
                              <p className="text-[11px] font-bold text-[#881337] tabular-nums">
                                ₹{p.price}
                              </p>
                              <button
                                onClick={() => onAddToCart(p)}
                                className="mt-1 text-[10px] font-bold text-white bg-[#881337] hover:bg-[#9F1239] px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer"
                              >
                                <ShoppingBag className="w-2.5 h-2.5" />
                                <span>Add to Cart</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Cake Idea Card */}
                  {msg.customCakeIdea && (
                    <div className="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-950">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Bespoke Design Suggestion:</span>
                      </div>
                      <p className="text-[11px]">{msg.customCakeIdea}</p>
                      <button
                        onClick={() => {
                          onStartCustomOrder();
                          onClose();
                        }}
                        className="mt-2 text-[11px] font-bold text-purple-800 hover:text-purple-950 underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Custom Cake Builder</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Option Buttons */}
              {msg.quickOptions && msg.quickOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-11 max-w-[85%]">
                  {msg.quickOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSend(opt)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white hover:bg-rose-50 text-stone-700 hover:text-[#881337] border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-[#881337] flex items-center justify-center shrink-0 border border-rose-200">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="p-3 rounded-2xl bg-white border border-rose-100 text-xs text-stone-500 shadow-2xs flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-spin" />
                <span>Chef Bliss is crafting recommendations...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-rose-100 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ask about flavours, eggless cakes, guest count, or budget..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-full border border-stone-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200/50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-[#881337] hover:bg-[#9F1239] disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
