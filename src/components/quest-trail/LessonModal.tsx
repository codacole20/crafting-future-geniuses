import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function LessonModal({
  open,
  lesson,
  onClose,
  onComplete,
}: {
  open: boolean;
  lesson: any;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [loading, setLoading] = useState(false);
  
  if (!open || !lesson) return null;

  const getButtonLabel = () => {
    if (lesson.type === "video") return "Mark as Watched";
    if (lesson.type === "quiz") return "Submit Quiz";
    if (lesson.type === "scenario") return "Finish Scenario";
    return "Complete";
  };

  const handleComplete = async () => {
    const xpToAward = Number(lesson.xp_reward) || 0;
    setLoading(true);
    try {
      await onComplete();
      // The XP update will be handled by the parent component
    } catch (error) {
      console.error("Failed to complete lesson:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-40 p-2">
      <motion.div
        className="bg-white rounded-card w-full max-w-[420px] p-6 shadow-ct"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="font-poppins font-semibold text-xl mb-4">{lesson.title}</h2>
        <div className="mb-6">
          {lesson.type === "video" && (
            <div className="aspect-video bg-gray-100 rounded flex items-center justify-center mb-4">
              {lesson.title === "Introduction to AI & Entrepreneurship" ? (
                <iframe 
                  src="https://www.loom.com/embed/720b31c8ab4349838344c5461a0a0929" 
                  frameBorder="0" 
                  allowFullScreen 
                  className="w-full h-full rounded"
                ></iframe>
              ) : (
                <span className="text-gray-500">Video Placeholder</span>
              )}
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
            disabled={loading}
            className="border border-gray-300 rounded-pill px-4 py-2 hover:bg-gray-100"
          >
            Close
          </button>
          <Button
            onClick={handleComplete}
            disabled={loading}
            className="bg-[#7BB3E5] text-white px-4 py-2 rounded-pill min-w-[128px]"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="loader loader-sm border-t-[#fff]" />
                <span>Saving...</span>
              </span>
            ) : (
              getButtonLabel()
            )}
          </Button>
        </div>
        {/* Loader spinner */}
        <style>
          {`
            .loader {
              display: inline-block;
              width: 18px;
              height: 18px;
              border: 2.5px solid #b4e1fa;
              border-radius: 50%;
              border-top: 2.5px solid #7BB3E5;
              animation: spin 0.8s linear infinite;
              margin-right: 4px;
              margin-bottom: -2px;
            }
            .loader-sm { width:16px; height:16px }
            @keyframes spin {
              0% { transform: rotate(0deg);}
              100% { transform: rotate(360deg);}
            }
          `}
        </style>
      </motion.div>
    </div>
  );
}
