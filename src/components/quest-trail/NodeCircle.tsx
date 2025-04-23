
import { Check, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface NodeCircleProps {
  state: "completed" | "unlocked" | "locked";
  sequence: number;
  highlight?: boolean;
}

export default function NodeCircle({ state, sequence, highlight }: NodeCircleProps) {
  const baseClasses =
    "flex items-center justify-center rounded-full shadow-ct text-white font-poppins font-bold";
  
  if (state === "completed") {
    return (
      <motion.div
        className={baseClasses + " bg-[#A2E3F4]"}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 0.3,
          type: "spring"
        }}
        style={{
          width: 48, height: 48,
        }}
      >
        <Check size={28} color="white" />
      </motion.div>
    );
  }
  
  if (state === "locked") {
    return (
      <motion.div
        className={baseClasses}
        style={{
          width: 48,
          height: 48,
          background: "rgba(235,195,103,0.04)",
          border: "2px solid #EBC367",
          color: "#EBC367",
        }}
        initial={{ scale: 1 }}
        animate={highlight ? { scale: 0.95 } : undefined}
        transition={{
          duration: 0.3,
          type: "spring"
        }}
      >
        <Lock size={28} color="#EBC367" />
      </motion.div>
    );
  }
  
  // unlocked
  return (
    <motion.div
      className={baseClasses + " bg-[#7BB3E5]"}
      style={{
        width: 48,
        height: 48,
      }}
      initial={{ scale: 1 }}
      animate={highlight ? { scale: 1.05 } : undefined}
      whileHover={{ scale: 1.05 }}
      transition={{
        duration: 0.3,
        type: "spring"
      }}
    >
      <span className="text-xl">{sequence}</span>
    </motion.div>
  );
}
