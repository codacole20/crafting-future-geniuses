
import { Flame } from "lucide-react";
import { motion } from "framer-motion";

interface HeaderCardProps {
  xp: number;
  streak: number;
  streakGlow?: boolean;
}
export default function HeaderCard({ xp, streak, streakGlow }: HeaderCardProps) {
  const displayXp = Number(xp) || 0; // Ensure XP is always a number, defaulting to 0
  
  return (
    <div className="w-full bg-[#FAF8F3] rounded-[20px] shadow-ct py-4 px-5 flex justify-between items-center mb-3">
      <div>
        <div className="text-md font-poppins text-gray-600 mb-1">XP Bank</div>
        <div className="text-2xl font-bold text-[#7BB3E5] font-poppins">{displayXp}</div>
      </div>
      <motion.div
        className="flex items-center"
        animate={streakGlow ? { scale: [1, 1.18, 1], boxShadow: ["0 0 0 0 #FACD7B", "0 0 16px 4px #FACD7B", "0 0 0 0 #FACD7B"] } : {}}
        transition={{ type: "spring", stiffness: 250, damping: 8, duration: 0.5 }}
      >
        <div className="flex items-center bg-[#FACD7B] rounded-pill px-3 py-[0.3rem] min-w-[55px] justify-center shadow">
          <Flame className="inline mr-1" size={20} color="#FFD66F" style={{ filter: streakGlow ? "drop-shadow(0 0 5px gold)" : undefined }} />
          <span className="font-poppins font-semibold text-gray-800">{streak}</span>
        </div>
      </motion.div>
    </div>
  );
}
