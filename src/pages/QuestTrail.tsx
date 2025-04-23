import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import HeaderCard from "@/components/quest-trail/HeaderCard";
import NodeCircle from "@/components/quest-trail/NodeCircle";
import LessonCard from "@/components/quest-trail/LessonCard";
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

const QUEST_BG = "#FAF8F3";
const PATH_GRADIENT = "linear-gradient(180deg, #FAF8F3 60%, #E8F9FF 100%)";
const PATH_COLOR = "#E6E6E6";

// Arrangement of points for the "wavy" layout, normalized [-1,1] horizontal offsets
const pathOffsets = [0, -0.18, 0.25, -0.22, 0.13];

const QuestTrail = () => {
  const { toast } = useToast();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lessons, setLessons] = useState(mockLessons);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [streakGlow, setStreakGlow] = useState(false);

  // Fix: first lesson is always unlocked if not completed
  const computeLessonState = (lesson: any, idx: number) => {
    if (lesson.completed) return "completed";
    if (idx === 0) return "unlocked";
    if (xp >= lesson.unlock_xp) return "unlocked";
    return "locked";
  };

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

  // Confetti stub
  const triggerConfetti = () => {};

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

    localStorage.setItem("userXp", newXp.toString());
    localStorage.setItem("userLessons", JSON.stringify(updatedLessons));
    triggerConfetti();

    toast({
      title: `+${lessons[idx].xp_reward} XP added to your bank!`,
      description: "",
    });
  };

  // Spine animation
  const [spineGrow, setSpineGrow] = useState(false);
  useEffect(() => {
    setTimeout(() => setSpineGrow(true), 40);
  }, []);

  const openLesson = (lesson: any, idx: number) => {
    if (computeLessonState(lesson, idx) !== "locked") {
      setSelectedLesson(lesson);
      setShowLessonModal(true);
    }
  };

  // Responsive: Render nothing if no lessons
  if (!lessons || lessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <span className="text-gray-800 font-poppins font-semibold text-lg">
          Start your first Quest to earn XP!
        </span>
      </div>
    );
  }

  // Main trail body
  return (
    <div
      className="w-full flex justify-center min-h-screen py-0 sm:py-4 lg:py-8"
      style={{
        background: PATH_GRADIENT,
      }}
    >
      <div className="w-full max-w-[480px] flex flex-col items-center relative pb-24">
        <HeaderCard xp={xp} streak={streak} streakGlow={streakGlow} />
        <h1 className="text-2xl font-poppins font-semibold mt-3 mb-8 text-gray-800">
          Quest Trail
        </h1>
        <TrailBoard
          lessons={lessons}
          xp={xp}
          computeLessonState={computeLessonState}
          lessonTags={lessonTags}
          openLesson={openLesson}
        />
        
        {/* Lesson modal */}
        {showLessonModal && selectedLesson && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-40 p-2">
            <motion.div
              className="bg-white rounded-card w-full max-w-[420px] p-6 shadow-ct"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h2 className="font-poppins font-semibold text-xl mb-4">{selectedLesson.title}</h2>
              <div className="mb-6">
                {selectedLesson.type === "video" && (
                  <div className="aspect-video bg-gray-100 rounded flex items-center justify-center mb-4">
                    <span className="text-gray-500">Video Placeholder</span>
                  </div>
                )}
                {selectedLesson.type === "quiz" && (
                  <div className="bg-gray-100 rounded p-4">
                    <b>Quiz coming soon!</b>
                  </div>
                )}
                {selectedLesson.type === "scenario" && (
                  <div className="bg-gray-100 rounded p-4">
                    <b>Scenario coming soon!</b>
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLessonModal(false)}
                  className="border border-gray-300 rounded-pill px-4 py-2 hover:bg-gray-100"
                >
                  Close
                </button>
                <button
                  onClick={() => completeLesson(selectedLesson.id)}
                  className="bg-[#7BB3E5] text-white rounded-pill px-4 py-2"
                >
                  {selectedLesson.type === "video" ? "Mark as Watched" : "Submit Answer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * TrailBoard aligns nodes along a wavy svg path background for a modern game-like map.
 */
function TrailBoard({ lessons, xp, computeLessonState, lessonTags, openLesson }: any) {
  // Responds to window width (max 440px)
  const [containerWidth, setContainerWidth] = useState(340);

  useEffect(() => {
    function handleResize() {
      setContainerWidth(Math.min(window.innerWidth - 32, 440));
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate positions for nodes along a wavy path
  const nodePositions = lessons.map((_: any, idx: number) =>
    getTrailNodePos(idx, containerWidth)
  );

  // Create SVG path for background trail
  const svgPathD = (() => {
    if (nodePositions.length < 2) return "";
    let d = `M ${nodePositions[0].x} ${nodePositions[0].y}`;
    for (let i = 1; i < nodePositions.length; i++) {
      // Use quadratic curve between points
      const prev = nodePositions[i - 1];
      const curr = nodePositions[i];
      const controlX = (prev.x + curr.x) / 2 + (i % 2 === 0 ? 16 : -16);
      const controlY = (prev.y + curr.y) / 2;
      d += ` Q ${controlX} ${controlY} ${curr.x} ${curr.y}`;
    }
    return d;
  })();

  // The last node position determines the total height
  const lastNodePos = nodePositions[nodePositions.length - 1];
  const totalHeight = lastNodePos ? lastNodePos.y + 140 : 600;

  return (
    <div
      className="relative w-full mx-auto"
      style={{
        minHeight: totalHeight,
        height: totalHeight,
        maxWidth: containerWidth,
      }}
    >
      {/* SVG Path (trail) */}
      <svg
        width={containerWidth}
        height={totalHeight}
        className="absolute left-1/2 -translate-x-1/2 top-0 z-0 pointer-events-none"
      >
        <defs>
          <linearGradient
            id="trail-grad"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#E6E6E6" />
            <stop offset="100%" stopColor="#A2E3F4" />
          </linearGradient>
        </defs>
        <path
          d={svgPathD}
          stroke="url(#trail-grad)"
          strokeWidth={4}
          fill="none"
          opacity="0.82"
          style={{
            filter: "drop-shadow(0 2px 6px rgba(160,160,160,0.11))",
          }}
        />
      </svg>
      
      {/* Lesson Nodes over the SVG */}
      {lessons.map((lesson: any, idx: number) => {
        const state = computeLessonState(lesson, idx);
        const prevState = idx > 0 ? computeLessonState(lessons[idx - 1], idx - 1) : "completed";
        const { x, y } = nodePositions[idx];
        
        return (
          <motion.div
            key={lesson.id}
            whileTap={{ scale: state !== "locked" ? 0.97 : 1.0 }}
            animate={state !== "locked" ? { y: [y - 10, y] } : {}}
            transition={{
              duration: 0.31,
              type: "spring",
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: x,
              top: y,
              zIndex: 2,
            }}
          >
            {/* Node Circle Component */}
            <div className="flex flex-col items-center">
              <NodeCircle
                state={state}
                sequence={lesson.sequence_no}
                highlight={state === "unlocked" && prevState !== "unlocked"}
              />
              
              {/* Lesson Card */}
              <div className="mt-14" style={{ width: "280px", maxWidth: "85vw" }}>
                <LessonCard
                  locked={state === "locked"}
                  title={lesson.title}
                  tagIcon={lessonTags[lesson.type]?.icon}
                  tagLabel={lessonTags[lesson.type]?.label}
                  xpReward={lesson.xp_reward}
                  onClick={() => openLesson(lesson, idx)}
                  remainingXp={lesson.unlock_xp - xp}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Get positions for nodes along the wavy path with improved spacing
 */
function getTrailNodePos(idx: number, containerWidth: number) {
  // Centered on column, wavy left-right offsets with wider spacing
  const pathOffsets = [0, -0.18, 0.22, -0.13, 0.25, -0.22, 0.17]; 
  const normOffset = pathOffsets[idx % pathOffsets.length];
  
  // Calculate x position with horizontal offset
  const x = 0.5 * containerWidth + normOffset * (containerWidth * 0.34 - 14 * (idx % 2));
  
  // Increase vertical spacing between nodes significantly
  const y = 120 + idx * 180;
  
  return { x, y };
}

export default QuestTrail;
