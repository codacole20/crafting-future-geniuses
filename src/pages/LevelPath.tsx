
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Mock lesson data - in a real app this would come from an API
const mockLessons = [
  {
    id: "lesson1",
    title: "Introduction to AI & Entrepreneurship",
    type: "video",
    unlockXp: 0,
    earnedXp: 10,
    completed: false,
    locked: false,
  },
  {
    id: "lesson2",
    title: "Finding Your Niche",
    type: "quiz",
    unlockXp: 10,
    earnedXp: 15,
    completed: false,
    locked: true,
  },
  {
    id: "lesson3",
    title: "Market Research Basics",
    type: "scenario",
    unlockXp: 25,
    earnedXp: 20,
    completed: false,
    locked: true,
  },
  {
    id: "lesson4",
    title: "AI Tools for Entrepreneurs",
    type: "video",
    unlockXp: 45,
    earnedXp: 15,
    completed: false,
    locked: true,
  },
  {
    id: "lesson5",
    title: "Creating Your MVP",
    type: "scenario",
    unlockXp: 60,
    earnedXp: 25,
    completed: false,
    locked: true,
  },
];

const LevelPath = () => {
  const [userXp, setUserXp] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lessons, setLessons] = useState(mockLessons);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  // Load user data from localStorage
  useEffect(() => {
    const savedXp = localStorage.getItem("userXp");
    const savedStreak = localStorage.getItem("userStreak");
    const lastLoginDate = localStorage.getItem("lastLoginDate");
    const savedLessons = localStorage.getItem("userLessons");
    
    if (savedXp) setUserXp(parseInt(savedXp));
    if (savedStreak) setCurrentStreak(parseInt(savedStreak));
    if (savedLessons) setLessons(JSON.parse(savedLessons));
    
    // Check streak
    const today = new Date().toDateString();
    if (lastLoginDate && lastLoginDate !== today) {
      const lastLogin = new Date(lastLoginDate);
      const currentDate = new Date();
      const diffDays = Math.floor((currentDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day, increment streak
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        localStorage.setItem("userStreak", newStreak.toString());
      } else if (diffDays > 1) {
        // Streak broken
        setCurrentStreak(1);
        localStorage.setItem("userStreak", "1");
      }
    }
    
    // Update last login
    localStorage.setItem("lastLoginDate", today);
  }, []);

  // Update lessons based on user XP
  useEffect(() => {
    const updatedLessons = lessons.map((lesson) => ({
      ...lesson,
      locked: lesson.unlockXp > userXp
    }));
    setLessons(updatedLessons);
    localStorage.setItem("userLessons", JSON.stringify(updatedLessons));
  }, [userXp]);

  const completeLesson = (lessonId: string) => {
    // Find the lesson
    const lessonIndex = lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1) return;
    
    // Mark as completed and update XP
    const updatedLessons = [...lessons];
    updatedLessons[lessonIndex].completed = true;
    
    const newXp = userXp + updatedLessons[lessonIndex].earnedXp;
    
    // Update state and localStorage
    setLessons(updatedLessons);
    setUserXp(newXp);
    setShowLessonModal(false);
    
    localStorage.setItem("userXp", newXp.toString());
    localStorage.setItem("userLessons", JSON.stringify(updatedLessons));
  };

  const openLesson = (lesson: any) => {
    if (!lesson.locked) {
      setSelectedLesson(lesson);
      setShowLessonModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-ct-paper p-6 pb-20">
      {/* XP and Streak Banner */}
      <motion.div 
        className="bg-ct-white rounded-card shadow-ct p-4 mb-6 flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="font-semibold text-gray-800">Experience</h2>
          <div className="text-xl font-bold text-ct-teal">{userXp} XP</div>
        </div>
        <div className="flex items-center">
          <div className="bg-ct-yellow rounded-pill px-3 py-1 flex items-center">
            <span className="mr-1">🔥</span>
            <span className="font-medium">{currentStreak} day streak</span>
          </div>
        </div>
      </motion.div>

      {/* Learning Path */}
      <h1 className="text-2xl font-semibold mb-6 font-poppins">Your Learning Path</h1>
      
      <div className="relative">
        <div className="absolute left-[22px] top-0 bottom-0 w-1 bg-gray-200 z-0"></div>
        
        {lessons.map((lesson, index) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => openLesson(lesson)}
            className={`
              relative z-10 mb-6 flex items-start
              ${lesson.locked ? 'opacity-70' : ''}
            `}
          >
            <div 
              className={`
                w-12 h-12 rounded-full flex items-center justify-center text-white shadow-ct mr-4
                ${lesson.completed ? 'bg-ct-gold' : lesson.locked ? 'bg-gray-400' : 'bg-ct-teal'}
              `}
            >
              {lesson.completed ? '✓' : (index + 1)}
            </div>
            <div 
              className={`
                flex-1 bg-ct-white rounded-card shadow-ct p-4
                ${lesson.locked ? 'bg-gray-100' : ''}
              `}
            >
              <h3 className="font-medium">{lesson.title}</h3>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-gray-600">
                  {lesson.type === 'video' ? '📺 Video Lesson' :
                   lesson.type === 'quiz' ? '❓ Quiz' : '🎭 Scenario'}
                </span>
                <span className="bg-ct-sky text-gray-700 px-2 py-1 rounded-pill text-xs">
                  +{lesson.earnedXp} XP
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lesson Modal */}
      {showLessonModal && selectedLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div 
            className="bg-ct-white rounded-card w-full max-w-md p-5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-xl font-semibold mb-4">{selectedLesson.title}</h2>
            
            <div className="mb-6">
              {selectedLesson.type === 'video' && (
                <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-4">
                  <div className="text-gray-500">Video Content Placeholder</div>
                </div>
              )}
              
              {selectedLesson.type === 'quiz' && (
                <div className="bg-gray-100 rounded-md p-4 mb-4">
                  <p className="mb-2">Sample quiz question:</p>
                  <p className="font-medium mb-3">Which of these is NOT a common way for startups to validate ideas?</p>
                  <div className="space-y-2">
                    <div className="p-2 border rounded cursor-pointer hover:bg-gray-50">
                      Customer interviews
                    </div>
                    <div className="p-2 border rounded cursor-pointer hover:bg-gray-50">
                      Landing page tests
                    </div>
                    <div className="p-2 border rounded cursor-pointer hover:bg-gray-50 bg-ct-teal/10">
                      Building the full product first
                    </div>
                  </div>
                </div>
              )}
              
              {selectedLesson.type === 'scenario' && (
                <div className="bg-gray-100 rounded-md p-4 mb-4">
                  <p className="mb-2">Scenario:</p>
                  <p className="mb-3">You've identified a business opportunity, but aren't sure if customers will pay for it. What's your first step?</p>
                  <div className="space-y-2">
                    <div className="p-2 border rounded cursor-pointer hover:bg-gray-50">
                      Build an MVP and test with real users
                    </div>
                    <div className="p-2 border rounded cursor-pointer hover:bg-gray-50 bg-ct-teal/10">
                      Conduct interviews with potential customers
                    </div>
                    <div className="p-2 border rounded cursor-pointer hover:bg-gray-50">
                      Start a crowdfunding campaign
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={() => setShowLessonModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-pill hover:bg-gray-50"
              >
                Close
              </button>
              <button 
                onClick={() => completeLesson(selectedLesson.id)}
                className="px-4 py-2 bg-ct-teal text-white rounded-pill hover:bg-ct-teal/90"
              >
                {selectedLesson.type === 'video' ? "Mark as Watched" : "Submit Answer"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LevelPath;
