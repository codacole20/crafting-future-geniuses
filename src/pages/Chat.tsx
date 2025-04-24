
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai" | "student";
  timestamp: Date;
  recommendedLessons?: string[];
  username?: string;
}

// Mock data for student forum threads
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState(5);
  
  // Mock thread responses
  const [threads, setThreads] = useState(mockStudentThreads);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);

  // Get current user on component mount
  useEffect(() => {
    const getUserData = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        // Get user profile from database
        const { data: userData, error } = await supabase
          .from('Crafting Tomorrow Users')
          .select('*')
          .eq('email', data.user.email)
          .single();
          
        if (!error && userData) {
          setCurrentUser(userData);
        }
      }
    };

    getUserData();
  }, []);

  const sendMessage = async () => {
    if (!userInput.trim() || loading) return;
    
    if (rateLimited) {
      toast({
        title: "Slow down a bit",
        description: "You're sending messages too quickly. Please wait a moment.",
      });
      return;
    }
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: userInput,
      sender: "user",
      timestamp: new Date(),
    };
    
    setChatMessages([...chatMessages, userMessage]);
    setUserInput("");
    setLoading(true);
    
    try {
      if (!currentUser) {
        throw new Error("Please sign in to use the AI Tutor");
      }

      // Call the edge function for AI response
      const { data, error } = await supabase.functions.invoke('ai-tutor-chat', {
        body: {
          message: userInput,
          userId: currentUser.id
        }
      });
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || "Failed to get AI response");
      }
      
      // Update remaining requests count
      if (data.remainingRequests !== undefined) {
        setRemainingRequests(data.remainingRequests);
        // Set rate limited flag if approaching limit
        setRateLimited(data.remainingRequests <= 0);
        
        // Reset rate limited flag after a minute
        if (data.remainingRequests <= 0) {
          setTimeout(() => setRateLimited(false), 60 * 1000);
        }
      }
      
      // Add AI response to chat
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        sender: "ai",
        timestamp: new Date(),
        recommendedLessons: [], // Can be populated with actual lesson data if needed
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error.message || "We're retrying—please wait a moment.",
        sender: "ai",
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Oops!",
        description: error.message || "We're having trouble connecting to the AI. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThreadSubmit = () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;
    
    // In a real app, we would check for profanity here
    
    const newThread = {
      id: Date.now().toString(),
      title: newThreadTitle,
      author: "You",
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
                      {message.sender === "ai" && currentUser?.avatar_url && (
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden mr-2 bg-ct-sky flex-shrink-0">
                            <img 
                              src={currentUser.avatar_url} 
                              alt="AI" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium">MentorBot</span>
                        </div>
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
              </div>
              
              <div className="p-4 border-t">
                {rateLimited ? (
                  <div className="text-amber-600 text-sm mb-2 p-2 bg-amber-50 rounded-md">
                    You've reached the message limit. Please wait a minute before sending more messages.
                  </div>
                ) : remainingRequests <= 1 && (
                  <div className="text-amber-600 text-sm mb-2">
                    {remainingRequests === 1 ? "1 more message" : "0 messages"} left before cooldown.
                  </div>
                )}
                <div className="flex items-center">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={currentUser ? "Ask your AI mentor anything..." : "Please sign in to use the AI Tutor"}
                    className="flex-1 border rounded-pill py-2 px-4 focus:outline-none focus:ring-1 focus:ring-ct-teal"
                    disabled={loading || rateLimited || !currentUser}
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={loading || !userInput.trim() || rateLimited || !currentUser}
                    className="ml-2 bg-ct-teal hover:bg-ct-teal/90 rounded-full p-2 h-10 w-10"
                  >
                    <Send size={18} />
                  </Button>
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
