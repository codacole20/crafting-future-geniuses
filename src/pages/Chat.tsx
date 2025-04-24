import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useGuestUser } from "@/hooks/useGuestUser";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai" | "student";
  timestamp: Date;
  recommendedLessons?: string[];
  username?: string;
}

const mockStudentThreads = [
  {
    id: "thread1",
    title: "How to validate my app idea?",
    author: "Emma",
    message: "I have an idea for an app that helps students find study partners. How should I validate if people actually need this?",
    replies: 3,
    kudos: 7,
    createdAt: new Date(Date.now() - 3600000 * 24),
  },
  {
    id: "thread2",
    title: "Best AI tools for logo design?",
    author: "Noah",
    message: "Looking for recommendations on AI tools that can help with creating a logo for my startup. Any suggestions?",
    replies: 5,
    kudos: 12,
    createdAt: new Date(Date.now() - 3600000 * 36),
  },
  {
    id: "thread3",
    title: "How to pitch to investors?",
    author: "Sophia",
    message: "I'm preparing my first investor pitch. Any tips on what I should focus on for a tech education startup?",
    replies: 8,
    kudos: 15,
    createdAt: new Date(Date.now() - 3600000 * 48),
  },
];

const Chat = () => {
  const { toast } = useToast();
  const { user } = useGuestUser();
  const [activeTab, setActiveTab] = useState("chatbot");
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hi there! I'm your AI mentor. How can I help you today with entrepreneurship or AI?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const messageLimit = user?.isGuest ? 5 : 10;
  const messageTimeWindow = 60000;

  const [threads, setThreads] = useState(mockStudentThreads);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (lastMessageTime) {
      const timer = setTimeout(() => {
        setMessageCount(0);
        setLastMessageTime(null);
      }, messageTimeWindow);
      
      return () => clearTimeout(timer);
    }
  }, [lastMessageTime]);

  const checkRateLimit = (): boolean => {
    const now = new Date();
    
    if (lastMessageTime && messageCount >= messageLimit) {
      const timeSinceLastMessage = now.getTime() - lastMessageTime.getTime();
      if (timeSinceLastMessage < messageTimeWindow) {
        toast({
          title: "Please slow down",
          description: `You can send ${messageLimit} messages per minute. Try again in a moment.`,
        });
        return false;
      } else {
        setMessageCount(1);
        setLastMessageTime(now);
        return true;
      }
    } else {
      setMessageCount(prev => prev + 1);
      setLastMessageTime(now);
      return true;
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    if (!checkRateLimit()) return;
    
    let username = "Guest";
    if (user) {
      if (!user.isGuest && "displayName" in user) {
        username = user.displayName || user.email || "Student";
      } else if (user.isGuest) {
        username = "Guest";
      }
    }
    
    const userMessage: Message = {
      id: uuidv4(),
      content: userInput,
      sender: "user",
      timestamp: new Date(),
      username,
    };
    
    setChatMessages([...chatMessages, userMessage]);
    setUserInput("");
    setLoading(true);
    
    try {
      const timeoutId = setTimeout(() => {
        throw new Error("Request timed out. The tutor is thinking—please try again in a moment.");
      }, 20000);
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userInput,
          userId: user?.isGuest ? null : user?.id,
          guestId: user?.isGuest ? user.id : null,
          passions: user?.passions || []
        }
      });
      
      clearTimeout(timeoutId);
      
      if (error) {
        if (error.message && error.message.includes('401')) {
          throw new Error("No OpenAI key configured.");
        } else if (error.message && error.message.includes('429')) {
          throw new Error("Rate limit hit, please wait a minute.");
        }
        
        throw error;
      }
      
      const aiResponse: Message = {
        id: uuidv4(),
        content: data.reply,
        sender: "ai",
        timestamp: new Date(),
        recommendedLessons: data.recommendedLessons || [],
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      console.error("Error getting AI response:", error);
      
      const errorMessage = error.message || "The tutor is experiencing technical difficulties. Please try again.";
      
      const errorResponseMessage: Message = {
        id: uuidv4(),
        content: errorMessage,
        sender: "ai",
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev, errorResponseMessage]);
      
      toast({
        title: "Connection error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThreadSubmit = () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;
    
    let authorName = "Guest";
    if (user) {
      if (!user.isGuest && "displayName" in user) {
        authorName = user.displayName || user.email || "You";
      } else if (user.isGuest) {
        authorName = "Guest";
      }
    }
    
    const newThread = {
      id: Date.now().toString(),
      title: newThreadTitle,
      author: authorName,
      message: newThreadContent,
      replies: 0,
      kudos: 0,
      createdAt: new Date(),
    };
    
    setThreads([newThread, ...threads]);
    setNewThreadTitle("");
    setNewThreadContent("");
    setShowNewThreadForm(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-ct-paper pb-20">
      <div className="p-4">
        <Tabs defaultValue="chatbot" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4 bg-ct-white">
            <TabsTrigger value="chatbot" className="flex-1 py-2 data-[state=active]:bg-ct-teal data-[state=active]:text-white">
              AI Tutor
            </TabsTrigger>
            <TabsTrigger value="forum" className="flex-1 py-2 data-[state=active]:bg-ct-teal data-[state=active]:text-white">
              Student Forum
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chatbot" className="mt-0">
            <div className="bg-ct-white rounded-card shadow-ct h-[calc(100vh-180px)] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                {user?.isGuest && (
                  <div className="mb-4 p-2 bg-gray-50 rounded-md text-sm text-gray-600">
                    You're chatting as a <b>Guest</b>. Your chat history won't be saved. 
                    {user.passions && user.passions.length > 0 ? (
                      <p className="mt-1">
                        Your tutor knows about your interests in: {user.passions.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
                      </p>
                    ) : (
                      <p className="mt-1">
                        Update your interests in Settings for more personalized guidance!
                      </p>
                    )}
                  </div>
                )}
                
                {chatMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 ${message.sender === "user" ? "flex justify-end" : ""}`}
                  >
                    <div 
                      className={`
                        max-w-[80%] rounded-card p-3
                        ${message.sender === "user" 
                          ? "bg-ct-teal text-white ml-auto" 
                          : "bg-gray-100"}
                      `}
                    >
                      {message.username && message.sender === "user" && (
                        <p className="text-xs opacity-70 mb-1">{message.username}</p>
                      )}
                      <p className="mb-1">{message.content}</p>
                      <p className="text-xs opacity-70 text-right">
                        {formatDate(message.timestamp)}
                      </p>
                      
                      {message.recommendedLessons && message.recommendedLessons.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs mb-1 font-medium">Recommended lessons:</p>
                          <div className="flex flex-wrap gap-1">
                            {message.recommendedLessons.map(lesson => (
                              <span 
                                key={lesson} 
                                className="bg-ct-sky text-xs px-2 py-1 rounded-pill cursor-pointer hover:bg-ct-sky/80"
                              >
                                {lesson}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {loading && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                )}
                
                <div ref={messageEndRef} />
              </div>
              
              <div className="p-4 border-t">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Ask your AI mentor anything..."
                      className="flex-1 border rounded-pill py-2 px-4 focus:outline-none focus:ring-1 focus:ring-ct-teal"
                      disabled={loading}
                    />
                    <Button 
                      onClick={sendMessage}
                      disabled={loading || !userInput.trim()}
                      className="ml-2 bg-ct-teal hover:bg-ct-teal/90 rounded-full p-2 h-10 w-10"
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                  {user?.isGuest && messageCount > 0 && (
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {messageLimit - messageCount} messages remaining this minute
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="forum" className="mt-0">
            <div className="bg-ct-white rounded-card shadow-ct h-[calc(100vh-180px)] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-semibold">Student Discussions</h2>
                <Button 
                  onClick={() => setShowNewThreadForm(!showNewThreadForm)}
                  className="bg-ct-teal hover:bg-ct-teal/90 text-sm"
                >
                  {showNewThreadForm ? "Cancel" : "New Topic"}
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {showNewThreadForm && (
                  <div className="p-4 border-b bg-gray-50">
                    <input
                      type="text"
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                      placeholder="Topic title..."
                      className="w-full border rounded-md p-2 mb-2 focus:outline-none focus:ring-1 focus:ring-ct-teal"
                    />
                    <textarea
                      value={newThreadContent}
                      onChange={(e) => setNewThreadContent(e.target.value)}
                      placeholder="What would you like to discuss?"
                      className="w-full border rounded-md p-2 h-20 focus:outline-none focus:ring-1 focus:ring-ct-teal"
                    />
                    <div className="mt-2 flex justify-end">
                      <Button 
                        onClick={handleThreadSubmit}
                        disabled={!newThreadTitle.trim() || !newThreadContent.trim()}
                        className="bg-ct-teal hover:bg-ct-teal/90 text-sm"
                      >
                        Post Topic
                      </Button>
                    </div>
                  </div>
                )}
                
                {threads.map((thread) => (
                  <div key={thread.id} className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start">
                      <div className="bg-ct-sky rounded-full w-10 h-10 flex items-center justify-center mr-3">
                        <User size={18} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{thread.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{thread.message}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <span className="mr-3">By {thread.author}</span>
                          <span className="mr-3">{thread.replies} replies</span>
                          <span className="flex items-center">
                            <span className="mr-1">👍</span>
                            <span>{thread.kudos}</span>
                          </span>
                          <span className="ml-auto">{formatDate(thread.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {threads.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No discussions yet. Start a new topic!</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Chat;
