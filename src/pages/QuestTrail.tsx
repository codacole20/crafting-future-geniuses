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
const SPINE_COLOR = "#E6E6E6";

const QuestTrail = () => {
  const { toast } = useToast();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lessons, setLessons] = useState(mockLessons);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [streakGlow, setStreakGlow] = useState(false);

  // Load XP/streak data from localStorage; streak flows unchanged
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
        // Animation: streak increment glow/wobble
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

  // Confetti (Lottie) trigger here as stub
  const triggerConfetti = () => {
    // Placeholder: Integrate Lottie here
    // For now you might import/use a local animated asset
    // Or leave a visual placeholder (eg. emoji confetti)
    // If Lottie is required, you could add logic here
  };

  // Complete lesson
  const completeLesson = (lessonId: string) => {
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) return;
    if (lessons[idx].completed) return;

    // Simulate XP POST event and completion
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

  // Used to animate spine growing down
  const [spineGrow, setSpineGrow] = useState(false);
  useEffect(() => {
    setTimeout(() => setSpineGrow(true), 40);
  }, []);

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
    <div className="w-full flex justify-center min-h-screen bg-[#FAF8F3] py-0 sm:py-4 lg:py-8">
      <div className="w-full max-w-[480px] flex flex-col items-center">
        <HeaderCard xp={xp} streak={streak} streakGlow={streakGlow} />
        <h1 className="text-2xl font-poppins font-semibold mt-3 mb-8">Quest Trail</h1>
        <div className="relative w-full flex flex-col items-center">
          {/* Spine */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 top-2 w-1"
            style={{
              background: SPINE_COLOR,
              borderRadius: "2px",
              zIndex: 0,
              minHeight: lessons.length * 116,
              height: spineGrow ? lessons.length * 116 : 0,
              transition: "height 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          />
          {/* Node List */}
          <div className="relative flex flex-col items-center w-full z-10">
            {lessons.map((lesson, i) => {
              const state = computeLessonState(lesson);
              const prevState = i > 0 ? computeLessonState(lessons[i - 1]) : "completed";
              return (
                <div key={lesson.id} className="flex flex-col items-center w-full mb-6">
                  <motion.div
                    whileTap={{ scale: state !== "locked" ? 0.97 : 1.0 }}
                    className="flex flex-col items-center w-full"
                  >
                    {/* Node */}
                    <NodeCircle
                      state={state}
                      sequence={lesson.sequence_no}
                      highlight={state === "unlocked" && prevState !== "unlocked"}
                    />
                    {/* Lesson Card */}
                    <LessonCard
                      locked={state === "locked"}
                      title={lesson.title}
                      tagIcon={lessonTags[lesson.type]?.icon}
                      tagLabel={lessonTags[lesson.type]?.label}
                      xpReward={lesson.xp_reward}
                      onClick={() => openLesson(lesson)}
                      remainingXp={lesson.unlock_xp - xp}
                    />
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Lesson modal follows original behavior */}
        {showLessonModal && selectedLesson && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-40 p-2">
            <motion.div
              className="bg-white rounded-card w-full max-w-[420px] p-6 shadow-ct"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h2 className="font-poppins font-semibold text-xl mb-4">{selectedLesson.title}</h2>
              {/* Content (keep as in LevelPath for now) */}
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

export default QuestTrail;
