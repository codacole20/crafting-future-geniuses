
import { useState, useEffect, useRef } from "react";
import HeaderCard from "@/components/quest-trail/HeaderCard";
import NodeCircle from "@/components/quest-trail/NodeCircle";
import LessonCard from "@/components/quest-trail/LessonCard";
import LessonModal from "@/components/quest-trail/LessonModal";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { CircleCheck, Lock, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

// Lesson type definition
interface Lesson {
  id: string;
  sequence_no: number;
  title: string;
  type: string;
  unlock_xp: number;
  xp_reward: number;
  completed: boolean;
  description?: string;
  user_id?: string;
}

const lessonTags = {
  video: { icon: "📺", label: "Watch" },
  quiz: { icon: "❓", label: "Quiz" },
  scenario: { icon: "🎭", label: "Scenario" },
};

// --- Tooltip component for node ---
function NodeTooltip({ text, visible }: { text: string; visible: boolean }) {
  return (
    <div
      className={`tooltip${visible ? " show-tooltip" : ""}`}
      role="tooltip"
      aria-live="polite"
      style={{
        minWidth: 0,
        maxWidth: 220,
        zIndex: 10,
      }}
    >
      {text}
    </div>
  );
}

// --- TrailNodeCircle component with tooltip (renamed to avoid conflict) ---
function TrailNodeCircle({
  state,
  sequence,
  highlight,
  onHover,
  onLeave,
  onClick,
  title,
  showTooltip,
}: {
  state: "completed" | "unlocked" | "locked";
  sequence: number;
  highlight?: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  title: string;
  showTooltip: boolean;
}) {
  // Color/size classes
  let classNames =
    "node-circle select-none cursor-pointer transition-shadow shadow-ct relative";
  if (state === "completed") classNames += " node-completed";
  else if (state === "unlocked") classNames += " node-unlocked";
  else if (state === "locked") classNames += " node-locked cursor-not-allowed";
  return (
    <div
      className={classNames}
      style={{
        width: 44,
        height: 44,
        marginBottom: 8,
        position: "relative",
        outline: highlight ? "2px solid #FACD7B" : undefined,
      }}
      aria-label={title}
      tabIndex={state !== "locked" ? 0 : -1}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      onTouchStart={onHover}
      onTouchEnd={onLeave}
      onClick={state !== "locked" ? onClick : undefined}
    >
      {state === "completed" ? (
        <CircleCheck size={26} color="#fff" strokeWidth={2.5} />
      ) : state === "locked" ? (
        <Lock size={22} color="#EBC367" strokeWidth={2.5} />
      ) : (
        <span className="text-base" style={{fontWeight:600}}>{sequence}</span>
      )}
      <NodeTooltip text={title} visible={showTooltip} />
    </div>
  );
}

// --- TrailLessonCard (simplified for trail, renamed to avoid conflict) ---
function TrailLessonCard({
  locked,
  title,
  tagIcon,
  tagLabel,
  xpReward,
  onClick,
}: {
  locked: boolean;
  title: string;
  tagIcon: string;
  tagLabel: string;
  xpReward: number;
  onClick: () => void;
}) {
  return (
    <div
      className={`w-full max-w-[300px] mx-auto rounded-[16px] shadow-ct px-4 py-3 mt-1 mb-0 transition-all 
        ${locked ? "bg-[#F4F4F4]/40 opacity-45 cursor-not-allowed" : "bg-[#FEFEFE] cursor-pointer"}
      `}
      onClick={locked ? undefined : onClick}
      aria-disabled={locked}
      tabIndex={locked ? -1 : 0}
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        border: "none",
      }}
    >
      <div className="font-poppins font-semibold text-base text-gray-900">{title}</div>
      <div className="flex justify-between items-center mt-1">
        <div className="flex items-center gap-2 text-[#7BB3E5] text-sm font-poppins">
          <span className="text-lg">{tagIcon}</span>
          <span>{tagLabel}</span>
        </div>
        <span
          className="ml-auto bg-[#E2F4FD] text-[#7BB3E5] font-poppins px-3 py-[2.5px] rounded-pill font-semibold text-xs shadow-sm"
          style={{ marginLeft: "auto" }}
        >
          +{xpReward} XP
        </span>
      </div>
      {locked && (
        <div className="mt-2">
          <div className="text-xs text-[#EBC367] font-poppins flex items-center">
            <Lock size={14} color="#EBC367" className="mr-1" />
            <span>🔒 Locked</span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- TrailLessonModal (renamed to avoid potential conflict) --- 
function TrailLessonModal({ open, lesson, onClose, onComplete }: {
  open: boolean;
  lesson: any;
  onClose: () => void;
  onComplete: () => void;
}) {
  if (!open || !lesson) return null;

  let actionLabel =
    lesson.type === "video"
      ? "Mark as Watched"
      : lesson.type === "quiz"
      ? "Start Quiz"
      : "Begin Scenario";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-40 p-2" role="dialog" aria-modal="true">
      <motion.div
        className="bg-white rounded-card w-full max-w-[410px] p-6 shadow-ct"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        role="document"
      >
        <h2 className="font-poppins font-semibold text-xl mb-4">{lesson.title}</h2>
        <div className="mb-6">
          {lesson.type === "video" && (
            <div className="aspect-video bg-gray-100 rounded flex items-center justify-center mb-4">
              <span className="text-gray-500">Video Placeholder</span>
            </div>
          )}
          {lesson.type === "quiz" && (
            <div className="bg-gray-100 rounded p-4">
              <b>Quiz coming soon!</b>
            </div>
          )}
          {lesson.type === "scenario" && (
            <div className="bg-gray-100 rounded p-4">
              <b>Scenario coming soon!</b>
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="border border-gray-300 rounded-pill px-4 py-2 hover:bg-gray-100"
          >
            Close
          </button>
          <button
            onClick={onComplete}
            className="bg-[#7BB3E5] text-white rounded-pill px-4 py-2"
          >
            {actionLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Loading skeleton for quest nodes
function QuestSkeletonPlaceholder() {
  return (
    <div className="flex flex-col items-center space-y-16 pb-12">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center">
          <Skeleton className="w-12 h-12 rounded-full mb-2" />
          <Skeleton className="w-64 h-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

const QuestTrail = () => {
  const { toast } = useToast();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [streakGlow, setStreakGlow] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const isMounted = useRef(true);

  // For tooltips (hover/long-press); stores the index of node hovered
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Set up the isMounted ref for cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load user data and lessons
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // Get current authenticated user
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          console.log("No authenticated user found");
          setIsLoading(false);
          return;
        }

        // Get user profile data
        const { data: userData, error } = await supabase
          .from('Crafting Tomorrow Users')
          .select('*')
          .eq('email', authData.user.email)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
          if (isMounted.current) setIsLoading(false);
          return;
        }

        if (!isMounted.current) return;
        setCurrentUser(userData);
        
        // Load XP/streak from localStorage
        const savedXp = localStorage.getItem("userXp");
        const savedStreak = localStorage.getItem("userStreak");
        if (savedXp) setXp(parseInt(savedXp));
        if (savedStreak) setStreak(parseInt(savedStreak));
        
        // Check streak
        const today = new Date().toDateString();
        const lastLoginDate = localStorage.getItem("lastLoginDate");
        if (lastLoginDate && lastLoginDate !== today) {
          const lastLogin = new Date(lastLoginDate);
          const currentDate = new Date();
          const diffDays = Math.floor((currentDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // Consecutive day, increment streak
            const newStreak = (parseInt(savedStreak || "0") || 0) + 1;
            setStreak(newStreak);
            localStorage.setItem("userStreak", newStreak.toString());
            setStreakGlow(true);
            setTimeout(() => setStreakGlow(false), 500);
          } else if (diffDays > 1) {
            // Streak broken
            setStreak(1);
            localStorage.setItem("userStreak", "1");
          }
        }
        
        // Load lessons for this user
        await loadLessons(userData.id);
        
        // Update last login
        localStorage.setItem("lastLoginDate", today);
      } catch (error) {
        console.error("Error loading user data:", error);
        toast({
          title: "Error",
          description: "Could not load your quest data",
          variant: "destructive"
        });
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Load lessons for current user
  const loadLessons = async (userId: string | number) => {
    try {
      let { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('user_id', userId)
        .order('sequence_no', { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        if (isMounted.current) setLessons(data);
      } else {
        // No lessons found, trigger generation
        // Always generate lessons regardless of passions
        await generateInitialLessons(userId, currentUser?.passions || ["general"]);
      }
    } catch (error) {
      console.error("Error loading lessons:", error);
      toast({
        title: "Error",
        description: "Could not load your quests",
      });
      
      // Use fallback lessons
      if (isMounted.current) {
        setLessons([
          {
            id: "lesson1",
            sequence_no: 1,
            title: "Introduction to AI & Entrepreneurship",
            type: "video",
            unlock_xp: 0,
            xp_reward: 10,
            completed: false,
            user_id: userId.toString()
          },
          {
            id: "lesson2",
            sequence_no: 2,
            title: "Finding Your Niche",
            type: "quiz",
            unlock_xp: 10,
            xp_reward: 15,
            completed: false,
            user_id: userId.toString()
          },
          {
            id: "lesson3",
            sequence_no: 3,
            title: "Market Research Basics",
            type: "scenario",
            unlock_xp: 25,
            xp_reward: 20,
            completed: false,
            user_id: userId.toString()
          },
        ]);
      }
    }
  };

  // Generate initial lessons if none exist
  const generateInitialLessons = async (userId: string | number, passionsArray: string[] = []) => {
    try {
      toast({
        title: "Creating your quest path...",
        description: "This may take a moment"
      });
      
      // Use general as fallback if passions array is empty
      const passions = passionsArray.length > 0 ? passionsArray : ["general"];
      
      const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
        body: {
          userId: userId,
          passions: passions
        }
      });
      
      if (error) throw error;
      
      if (data?.lessons && isMounted.current) {
        setLessons(data.lessons);
      }
    } catch (error) {
      console.error("Error generating initial lessons:", error);
      toast({
        title: "Could not generate custom quests",
        description: "Using default quests instead"
      });
      
      // Set fallback lessons if we're still mounted
      if (isMounted.current) {
        setLessons([
          {
            id: "lesson1",
            sequence_no: 1,
            title: "Introduction to AI & Entrepreneurship",
            type: "video",
            unlock_xp: 0,
            xp_reward: 10,
            completed: false,
            user_id: userId.toString()
          },
          {
            id: "lesson2",
            sequence_no: 2,
            title: "Finding Your Niche",
            type: "quiz",
            unlock_xp: 10,
            xp_reward: 15,
            completed: false,
            user_id: userId.toString()
          },
          {
            id: "lesson3",
            sequence_no: 3,
            title: "Market Research Basics",
            type: "scenario",
            unlock_xp: 25,
            xp_reward: 20,
            completed: false,
            user_id: userId.toString()
          },
        ]);
      }
    }
  };

  const computeLessonState = (lesson: any, index: number) => {
    if (lesson.completed) return "completed";
    if (index === firstIncompleteIndex) return "unlocked";
    if (xp >= lesson.unlock_xp) return "unlocked";
    return "locked";
  };

  const completeLesson = async (lessonId: string) => {
    try {
      setModalLoading(true);
      
      const idx = lessons.findIndex((l) => l.id === lessonId);
      if (idx === -1) return;
      if (lessons[idx].completed) return;

      const newXp = xp + lessons[idx].xp_reward;
      const updatedLessons = [...lessons];
      updatedLessons[idx].completed = true;
      
      // Update lesson in database
      if (currentUser) {
        const { error } = await supabase
          .from('lessons')
          .update({ completed: true })
          .eq('id', lessonId);
          
        if (error) throw error;
      }
      
      // Update local state
      setLessons(updatedLessons);
      setXp(newXp);
      
      // Show success toast
      toast({
        title: `+${lessons[idx].xp_reward} XP`,
        description: "",
      });
      
      // Update localStorage
      localStorage.setItem("userXp", newXp.toString());
      
      // Close modal
      setShowLessonModal(false);
    } catch (error) {
      console.error("Error completing lesson:", error);
      toast({
        title: "Couldn't save — try again.",
        description: "",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const openLesson = (lesson: any) => {
    if (computeLessonState(lesson, lessons.indexOf(lesson)) !== "locked") {
      setSelectedLesson(lesson);
      setShowLessonModal(true);
    }
  };

  const firstIncompleteIndex = lessons.findIndex(l => !l.completed);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-ct-teal mx-1 animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-3 h-3 rounded-full bg-ct-teal mx-1 animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-3 h-3 rounded-full bg-ct-teal mx-1 animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
          <span className="text-gray-800 font-poppins font-semibold text-lg">Loading your quest trail...</span>
        </div>
      </div>
    );
  }

  if (!lessons || lessons.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] py-0 sm:py-4 lg:py-8">
        <div className="w-full max-w-[480px] mx-auto flex flex-col items-center px-1">
          <HeaderCard xp={xp} streak={streak} streakGlow={streakGlow} />
          <h1 className="text-2xl font-poppins font-semibold mt-3 mb-7">Quest Trail</h1>
          <QuestSkeletonPlaceholder />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FAF8F3] py-0 sm:py-4 lg:py-8">
      <style>
        {`
        .trail-wrapper { 
          position: relative; 
          display: flex; 
          flex-direction: column;
          align-items: center;
          min-height: 120px;
          width: 100%;
        }
        .trail-wrapper::before {
          content: '';
          position: absolute;
          left: 50%; top: 0;
          width: 2px; height: 100%;
          background: #D3D3D3;
          transform: translateX(-50%);
          z-index: 0;
        }
        .node-circle {
          width: 44px; height: 44px; border-radius: 50%;
          display: flex; justify-content: center; align-items: center;
          font: 600 16px Poppins,sans-serif;
          position: relative;
          margin-bottom: 2px;
        }
        .node-unlocked {
          background: #7BB3E5;
          color: #fff;
        }
        .node-completed {
          background: #A2E3F4;
          color: #fff;
        }
        .node-locked {
          border: 2px solid #EBC367;
          color: #EBC367;
          background: transparent;
        }
        .tooltip {
          position: absolute;
          top: -36px;
          left: 50%;
          transform: translateX(-50%);
          background: #011627;
          color: #fff;
          padding: 4px 8px;
          border-radius: 8px;
          font: 400 12px Poppins,sans-serif;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity .15s;
          max-width: 220px;
          box-shadow:0 2px 8px 0 rgba(0,0,0,0.08);
        }
        .show-tooltip.tooltip { opacity: 1; }
        `}
      </style>
      <div className="w-full max-w-[480px] mx-auto flex flex-col items-center px-1">
        <HeaderCard xp={xp} streak={streak} streakGlow={streakGlow} />
        <h1 className="text-2xl font-poppins font-semibold mt-3 mb-7">Quest Trail</h1>
        <div className="trail-wrapper pb-4">
          {lessons.map((lesson, i) => {
            const state = computeLessonState(lesson, i);
            const prevState = i > 0 ? computeLessonState(lessons[i - 1], i - 1) : "completed";
            return (
              <div
                key={lesson.id}
                className="flex flex-col items-center relative w-full"
                style={{ marginBottom: 80 }}
              >
                <TrailNodeCircle
                  state={state}
                  sequence={lesson.sequence_no}
                  highlight={state === "unlocked" && prevState !== "unlocked"}
                  title={lesson.title}
                  showTooltip={hoveredIndex === i}
                  onHover={() => setHoveredIndex(i)}
                  onLeave={() => setHoveredIndex(null)}
                  onClick={() => openLesson(lesson)}
                />
                <TrailLessonCard
                  locked={state === "locked"}
                  title={lesson.title}
                  tagIcon={lessonTags[lesson.type as keyof typeof lessonTags]?.icon || "📄"}
                  tagLabel={lessonTags[lesson.type as keyof typeof lessonTags]?.label || "Read"}
                  xpReward={lesson.xp_reward}
                  onClick={() => openLesson(lesson)}
                />
              </div>
            );
          })}
        </div>
        
        <TrailLessonModal
          open={showLessonModal}
          lesson={selectedLesson}
          onClose={() => setShowLessonModal(false)}
          onComplete={async () => {
            if (selectedLesson) await completeLesson(selectedLesson.id);
          }}
        />
      </div>
    </div>
  );
};

export default QuestTrail;
