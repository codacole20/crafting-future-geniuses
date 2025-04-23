
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import HeaderCard from "@/components/quest-trail/HeaderCard";
import NodeCircle from "@/components/quest-trail/NodeCircle";
import LessonCard from "@/components/quest-trail/LessonCard";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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
    if (savedLessons) {
      try {
        const parsedLessons = JSON.parse(savedLessons);
        setLessons(parsedLessons);
      } catch (e) {
        console.error("Error parsing saved lessons:", e);
        setLessons(mockLessons);
      }
    }

    const today = new Date().toDateString();
    const lastLoginDate = localStorage.getItem("lastLoginDate");
    if (lastLoginDate && lastLoginDate !== today) {
      const lastLogin = new Date(lastLoginDate);
      const diffDays = Math.floor(
        (new Date().getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        const newStreak = parseInt(savedStreak || "0") + 1;
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
      className="w-full flex justify-center min-h-screen py-0 sm:py-4 lg:py-8 pb-24"
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
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-30 p-2">
            <motion.div
              className="bg-white rounded-card w-full max-w-[420px] p-6 shadow-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <h2 className="font-poppins font-semibold text-xl mb-4">{selectedLesson.title}</h2>
              <div className="mb-6">
                {selectedLesson.type === "video" && (
                  <div className="flex flex-col gap-4">
                    <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                      <iframe 
                        className="w-full h-full rounded-md"
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                        title="Video Lesson"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <p className="text-sm text-gray-600">
                      This video introduces key concepts in AI entrepreneurship and 
                      explores how artificial intelligence can create new business opportunities.
                    </p>
                  </div>
                )}
                {selectedLesson.type === "quiz" && (
                  <div className="bg-gray-100 rounded p-4">
                    <p className="mb-3 font-medium">Which of these is NOT a common way for startups to validate ideas?</p>
                    <div className="space-y-3">
                      <div className="p-3 border rounded cursor-pointer hover:bg-gray-50">
                        Customer interviews
                      </div>
                      <div className="p-3 border rounded cursor-pointer hover:bg-gray-50">
                        Landing page tests
                      </div>
                      <div className="p-3 border rounded cursor-pointer hover:bg-gray-50 bg-[#7BB3E5]/10">
                        Building the full product first
                      </div>
                    </div>
                  </div>
                )}
                {selectedLesson.type === "scenario" && (
                  <div className="bg-gray-100 rounded p-4">
                    <p className="mb-3 font-medium">You've identified a business opportunity, but aren't sure if customers will pay for it. What's your first step?</p>
                    <div className="space-y-3">
                      <div className="p-3 border rounded cursor-pointer hover:bg-gray-50">
                        Build an MVP and test with real users
                      </div>
                      <div className="p-3 border rounded cursor-pointer hover:bg-gray-50 bg-[#7BB3E5]/10">
                        Conduct interviews with potential customers
                      </div>
                      <div className="p-3 border rounded cursor-pointer hover:bg-gray-50">
                        Start a crowdfunding campaign
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowLessonModal(false)}
                  className="border border-gray-300 rounded-pill px-4 py-2 hover:bg-gray-100"
                >
                  Close
                </Button>
                <Button
                  onClick={() => completeLesson(selectedLesson.id)}
                  className="bg-[#7BB3E5] hover:bg-[#6AA3D5] text-white rounded-pill px-4 py-2"
                >
                  {selectedLesson.type === "video" ? "Mark as Watched" : "Submit Answer"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * TrailBoard alternates lesson cards left/right and centers lock icons.
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

  // Clean, elegant: center the path, alternate cards, no overlaps
  const nodeYStart = 90; // set the top offset for first node
  const yStep = 150; // vertical gap, more compact
  const dotXCenter = containerWidth / 2;

  // Alternate left/right for cards, always align node on center
  const leftCardX = dotXCenter - 165; // left side relative to center
  const rightCardX = dotXCenter + 26; // right side relative to center
  const cardWidth = 270;
  
  // Calculate node positions and card sides
  const nodePositions = lessons.map((_, idx) => ({
    x: dotXCenter,
    y: nodeYStart + idx * yStep,
    cardSide: idx % 2 === 0 ? "right" : "left", // Start: first card on right, then alternate
  }));

  // SVG path through all nodes (vertical but slightly curved for style)
  const svgPathD = (() => {
    if (nodePositions.length < 2) return "";
    let d = `M ${dotXCenter} ${nodePositions[0].y}`;
    for (let i = 1; i < nodePositions.length; i++) {
      // Add gentle curve for some organic feel
      const prev = nodePositions[i - 1];
      const curr = nodePositions[i];
      const curveX = dotXCenter + (i % 2 === 0 ? 20 : -20); // alternate curve
      const controlY = (prev.y + curr.y) / 2;
      d += ` Q ${curveX} ${controlY} ${dotXCenter} ${curr.y}`;
    }
    return d;
  })();

  // Only show lock icons at transition points between unlocked and locked lessons
  const lockPositions = [];
  for (let idx = 0; idx < lessons.length - 1; idx++) {
    const currentState = computeLessonState(lessons[idx], idx);
    const nextState = computeLessonState(lessons[idx + 1], idx + 1);
    
    // Only add a lock if this is a transition from unlocked/completed to locked
    if ((currentState === "unlocked" || currentState === "completed") && nextState === "locked") {
      lockPositions.push({
        x: dotXCenter,
        y: (nodePositions[idx].y + nodePositions[idx + 1].y) / 2,
        key: `lock-${idx}`,
      });
    }
  }

  return (
    <div
      className="relative w-full mx-auto"
      style={{
        height: nodePositions[nodePositions.length - 1].y + 170,
        minHeight: nodePositions[nodePositions.length - 1].y + 170,
        maxWidth: containerWidth,
      }}
    >
      {/* SVG Path */}
      <svg
        width={containerWidth}
        height={nodePositions[nodePositions.length - 1].y + 170}
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

      {/* Lock Icons - show only at transition points */}
      {lockPositions.map(({ x, y, key }) => (
        <div
          key={key}
          className="absolute z-20 flex items-center justify-center"
          style={{
            left: x - 23, // icon is 48px, align center
            top: y - 24,
            width: 46,
            height: 46,
            pointerEvents: "none",
          }}
        >
          <span
            className="rounded-full border-2 border-[#EBC367] bg-white"
            style={{
              width: 44, height: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            }}
          >
            <Lock size={28} color="#EBC367" />
          </span>
        </div>
      ))}

      {/* Nodes and Lesson Cards */}
      {lessons.map((lesson, idx) => {
        const state = computeLessonState(lesson, idx);
        const { x, y, cardSide } = nodePositions[idx];
        const cardX =
          cardSide === "right"
            ? rightCardX // slightly right of center
            : leftCardX - cardWidth + 48; // to the left, align vertically
        const cardAlign = cardSide === "right" ? "left" : "right";
        // Tighten zIndex so card sits nicely next to node, no overlap
        return (
          <div key={lesson.id}>
            {/* Node dot/circle */}
            <motion.div
              whileTap={{ scale: state !== "locked" ? 0.97 : 1.0 }}
              animate={state !== "locked" ? { y: [y - 5, y] } : { y }}
              transition={{
                duration: 0.3,
                type: "spring",
              }}
              className="absolute"
              style={{
                left: x - 24,
                top: y - 24,
                zIndex: 11,
              }}
            >
              <NodeCircle
                state={state}
                sequence={lesson.sequence_no}
                highlight={state === "unlocked"}
              />
            </motion.div>
            {/* Lesson Card */}
            <motion.div
              className={`absolute`}
              style={{
                width: cardWidth,
                left: cardSide === "right" ? rightCardX : leftCardX - cardWidth + 48,
                top: y - 32,
                zIndex: 10,
                display: "flex",
                justifyContent: cardAlign,
                alignItems: "center",
                pointerEvents: "auto",
              }}
            >
              <LessonCard
                locked={state === "locked"}
                title={lesson.title}
                tagIcon={lessonTags[lesson.type]?.icon}
                tagLabel={lessonTags[lesson.type]?.label}
                xpReward={lesson.xp_reward}
                onClick={() => openLesson(lesson, idx)}
                remainingXp={lesson.unlock_xp - xp}
              />
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export default QuestTrail;
