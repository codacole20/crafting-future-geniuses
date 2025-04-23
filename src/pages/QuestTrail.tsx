
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import HeaderCard from "@/components/quest-trail/HeaderCard";
import { CircleCheck, Lock, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock lesson data - replace with API in prod
const mockLessons = [
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
];

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

// --- NodeCircle component with tooltip ---
function NodeCircle({
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

// --- LessonCard (simplified for trail) ---
function LessonCard({
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

// --- LessonModal flow --- 
function LessonModal({ open, lesson, onClose, onComplete }: {
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

const QuestTrail = () => {
  const { toast } = useToast();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lessons, setLessons] = useState(mockLessons);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [streakGlow, setStreakGlow] = useState(false);

  // For tooltips (hover/long-press); stores the index of node hovered
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Load XP/streak/lessons from localStorage
  useEffect(() => {
    const savedXp = localStorage.getItem("userXp");
    const savedStreak = localStorage.getItem("userStreak");
    const savedLessons = localStorage.getItem("userLessons");
    if (savedXp) setXp(parseInt(savedXp));
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedLessons) setLessons(JSON.parse(savedLessons));
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
  }, []);

  const computeLessonState = (lesson: any) => {
    if (lesson.completed) return "completed";
    if (xp >= lesson.unlock_xp) return "unlocked";
    return "locked";
  };

  // Complete lesson (mark as complete)
  const completeLesson = (lessonId: string) => {
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) return;
    if (lessons[idx].completed) return;

    const newXp = xp + lessons[idx].xp_reward;
    const updatedLessons = [...lessons];
    updatedLessons[idx].completed = true;
    setLessons(updatedLessons);
    setXp(newXp);
    setShowLessonModal(false);
    toast({
      title: `+${lessons[idx].xp_reward} XP`,
      description: "",
    });
    localStorage.setItem("userXp", newXp.toString());
    localStorage.setItem("userLessons", JSON.stringify(updatedLessons));
  };

  // Show modal for non-locked lesson card only
  const openLesson = (lesson: any) => {
    if (computeLessonState(lesson) !== "locked") {
      setSelectedLesson(lesson);
      setShowLessonModal(true);
    }
  };

  // Responsive: Render nothing if no lessons
  if (!lessons || lessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <span className="text-gray-800 font-poppins font-semibold text-lg">Start your first Quest to earn XP!</span>
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
            const state = computeLessonState(lesson);
            const prevState = i > 0 ? computeLessonState(lessons[i - 1]) : "completed";
            return (
              <div
                key={lesson.id}
                className="flex flex-col items-center relative w-full"
                style={{ marginBottom: 80 }}
              >
                {/* NodeCircle with Tooltip */}
                <NodeCircle
                  state={state}
                  sequence={lesson.sequence_no}
                  highlight={state === "unlocked" && prevState !== "unlocked"}
                  title={lesson.title}
                  showTooltip={hoveredIndex === i}
                  onHover={() => setHoveredIndex(i)}
                  onLeave={() => setHoveredIndex(null)}
                  onClick={() => openLesson(lesson)}
                />
                {/* LessonCard */}
                <LessonCard
                  locked={state === "locked"}
                  title={lesson.title}
                  tagIcon={lessonTags[lesson.type]?.icon}
                  tagLabel={lessonTags[lesson.type]?.label}
                  xpReward={lesson.xp_reward}
                  onClick={() => openLesson(lesson)}
                />
              </div>
            );
          })}
        </div>
        {/* Modal for lesson actions */}
        <LessonModal
          open={showLessonModal}
          lesson={selectedLesson}
          onClose={() => setShowLessonModal(false)}
          onComplete={() => {
            if (selectedLesson) completeLesson(selectedLesson.id);
          }}
        />
      </div>
    </div>
  );
};

export default QuestTrail;
