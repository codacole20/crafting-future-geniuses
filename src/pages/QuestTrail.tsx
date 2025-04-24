
import { useState, useEffect } from "react";
import HeaderCard from "@/components/quest-trail/HeaderCard";
import LessonCard from "@/components/quest-trail/LessonCard";
import LessonModal from "@/components/quest-trail/LessonModal";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { CircleCheck, Lock, Circle } from "lucide-react";
import { useGuestUser } from "@/hooks/useGuestUser";
import { buildPersonalLearningPath, GeneratedLesson } from "@/utils/openai";
import { Button } from "@/components/ui/button";

// Define types
interface Lesson extends GeneratedLesson {
  id: string;
  completed: boolean;
}

// Define lesson tag types
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

// --- TrailNodeCircle component with tooltip ---
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

// --- TrailLessonCard ---
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

const QuestTrail = () => {
  const { toast } = useToast();
  const { user } = useGuestUser();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [streakGlow, setStreakGlow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPath, setGeneratingPath] = useState(false);

  // For tooltips (hover/long-press); stores the index of node hovered
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load XP and streak from localStorage
      const savedXp = localStorage.getItem("userXp");
      const savedStreak = localStorage.getItem("userStreak");
      if (savedXp) setXp(parseInt(savedXp));
      if (savedStreak) setStreak(parseInt(savedStreak));
      
      // Track login streak
      const today = new Date().toDateString();
      const lastLoginDate = localStorage.getItem("lastLoginDate");
      if (lastLoginDate && lastLoginDate !== today) {
        const lastLogin = new Date(lastLoginDate);
        const diffDays = Math.floor(
          (new Date().getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) {
          const newStreak = (parseInt(savedStreak || "0") || 0) + 1;
          setStreak(newStreak);
          localStorage.setItem("userStreak", newStreak.toString());
          setStreakGlow(true);
          setTimeout(() => setStreakGlow(false), 500);
          toast({
            title: "Quest mastered! 🔥 Streak +1.",
            description: "",
          });
        } else if (diffDays > 1) {
          setStreak(1);
          localStorage.setItem("userStreak", "1");
        }
      }
      localStorage.setItem("lastLoginDate", today);
      
      // Load lessons from localStorage first
      const savedLessons = localStorage.getItem("userLessons");
      if (savedLessons) {
        setLessons(JSON.parse(savedLessons));
      }
      
      // If user has passions, generate a custom learning path
      if (user && user.passions && user.passions.length > 0) {
        await generateLearningPath();
      } else {
        // Use default lessons from localStorage if no passions are set
        const defaultLessons = [
          {
            id: "lesson1",
            sequence_no: 1,
            title: "Introduction to AI & Entrepreneurship",
            type: "video",
            unlock_xp: 0,
            xp_reward: 10,
            completed: false,
          },
          {
            id: "lesson2",
            sequence_no: 2,
            title: "Finding Your Niche",
            type: "quiz",
            unlock_xp: 10,
            xp_reward: 15,
            completed: false,
          },
          {
            id: "lesson3",
            sequence_no: 3,
            title: "Market Research Basics",
            type: "scenario",
            unlock_xp: 25,
            xp_reward: 20,
            completed: false,
          },
          {
            id: "lesson4",
            sequence_no: 4,
            title: "AI Tools for Entrepreneurs",
            type: "video",
            unlock_xp: 45,
            xp_reward: 15,
            completed: false,
          },
          {
            id: "lesson5",
            sequence_no: 5,
            title: "Creating Your MVP",
            type: "scenario",
            unlock_xp: 60,
            xp_reward: 25,
            completed: false,
          },
          {
            id: "lesson6",
            sequence_no: 6,
            title: "Launch Strategy",
            type: "video",
            unlock_xp: 85,
            xp_reward: 30,
            completed: false,
          }
        ];
        
        if (!savedLessons) {
          setLessons(defaultLessons);
          localStorage.setItem("userLessons", JSON.stringify(defaultLessons));
        }
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Couldn't load your learning path. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateLearningPath = async () => {
    if (!user || !user.passions || user.passions.length === 0) return;
    
    setGeneratingPath(true);
    setError(null);
    
    try {
      // Get generated lessons from OpenAI
      const generatedLessons = await buildPersonalLearningPath(
        user.passions,
        user.isGuest ? null : user.id
      );
      
      // Convert to our lesson format
      const newLessons = generatedLessons.map((lesson, i) => ({
        ...lesson,
        id: `lesson${i+1}`,
        completed: false
      }));
      
      // Update local state and storage
      setLessons(newLessons);
      localStorage.setItem("userLessons", JSON.stringify(newLessons));
      
      toast({
        title: "Your new learning path is ready!",
        description: "Based on your selected passions.",
      });
    } catch (err) {
      console.error("Error generating learning path:", err);
      setError("We couldn't generate your custom path. Using a default path instead.");
      
      // Load default lessons as fallback
      const savedLessons = localStorage.getItem("userLessons");
      if (savedLessons) {
        setLessons(JSON.parse(savedLessons));
      }
    } finally {
      setGeneratingPath(false);
    }
  };

  const computeLessonState = (lesson: Lesson, index: number) => {
    if (lesson.completed) return "completed";
    if (index === firstIncompleteIndex) return "unlocked";
    if (xp >= lesson.unlock_xp) return "unlocked";
    return "locked";
  };

  const completeLesson = async (lessonId: string) => {
    try {
      const idx = lessons.findIndex((l) => l.id === lessonId);
      if (idx === -1) return;
      if (lessons[idx].completed) return;

      const newXp = xp + lessons[idx].xp_reward;
      const updatedLessons = [...lessons];
      updatedLessons[idx].completed = true;
      
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
      localStorage.setItem("userLessons", JSON.stringify(updatedLessons));
      
      // Close modal
      setShowLessonModal(false);
    } catch (error) {
      console.error("Error completing lesson:", error);
      toast({
        title: "Couldn't save — try again.",
        description: "",
      });
    }
  };

  const openLesson = (lesson: Lesson) => {
    if (computeLessonState(lesson, lessons.indexOf(lesson)) !== "locked") {
      setSelectedLesson(lesson);
      setShowLessonModal(true);
    }
  };

  const firstIncompleteIndex = lessons.findIndex(l => !l.completed);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block relative w-12 h-12">
              <div className="animate-ping absolute h-full w-full rounded-full bg-ct-teal/50"></div>
              <div className="relative rounded-full h-12 w-12 bg-ct-teal flex items-center justify-center">
                <span className="text-white text-xl">⚙️</span>
              </div>
            </div>
          </div>
          <p className="text-gray-800 font-medium">Loading your quest trail...</p>
        </div>
      </div>
    );
  }

  if (!lessons || lessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <div className="text-center">
          <p className="text-gray-800 font-poppins font-semibold text-lg mb-4">
            Start your first Quest to earn XP!
          </p>
          <Button 
            onClick={generateLearningPath} 
            disabled={generatingPath} 
            className="bg-ct-teal hover:bg-ct-teal/90"
          >
            {generatingPath ? "Generating..." : "Generate Learning Path"}
          </Button>
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
        
        <div className="flex justify-between items-center w-full mb-7">
          <h1 className="text-2xl font-poppins font-semibold mt-3">Quest Trail</h1>
          <Button 
            onClick={generateLearningPath}
            variant="outline"
            size="sm"
            disabled={generatingPath || !user || !user.passions || user.passions.length === 0}
            className="text-xs"
          >
            {generatingPath ? "Updating..." : "Update Path"}
          </Button>
        </div>
        
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-md mb-4 text-sm w-full">
            {error}
          </div>
        )}
        
        {user && user.passions && user.passions.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4 justify-center">
            {user.passions.slice(0, 6).map((passion) => (
              <span key={passion} className="bg-ct-sky/20 text-ct-teal/80 text-xs px-2.5 py-1 rounded-full">
                {passionOptions.find(p => p.id === passion)?.label || passion}
              </span>
            ))}
          </div>
        )}
        
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
                  tagIcon={lessonTags[lesson.type as keyof typeof lessonTags]?.icon || "📝"}
                  tagLabel={lessonTags[lesson.type as keyof typeof lessonTags]?.label || "Learn"}
                  xpReward={lesson.xp_reward}
                  onClick={() => openLesson(lesson)}
                />
              </div>
            );
          })}
        </div>
        {selectedLesson && (
          <LessonModal
            open={showLessonModal}
            lesson={selectedLesson}
            onClose={() => setShowLessonModal(false)}
            onComplete={async () => {
              if (selectedLesson) await completeLesson(selectedLesson.id);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default QuestTrail;
