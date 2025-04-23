
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
        initial={{ scale: 0.6 }}
        animate={{
          scale: [0.6, 1.1, 1],
        }}
        transition={{
          duration: 0.32,
          times: [0, 0.7, 1],
          type: "spring",
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
        initial={highlight ? { scale: 0.8 } : false}
        animate={
          highlight
            ? { scale: [1, 1.21, 0.95, 1.12, 1] }
            : undefined
        }
        transition={{
          times: [0, 0.35, 0.7, 0.92, 1],
          duration: 0.44,
          type: "spring",
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
      initial={highlight ? { scale: 0.8 } : { scale: 1 }}
      animate={
        highlight
          ? { scale: [0.8, 1.12, 0.94, 1.01, 1], boxShadow: ["0 0 0 0 #FACD7B", "0 0 13px 2px #FACD7B", "0 0 0 0 #FACD7B"] }
          : undefined
      }
      transition={{
        times: [0, 0.28, 0.5, 0.70, 1],
        duration: 0.36,
        type: "spring",
      }}
    >
      <span className="text-xl">{sequence}</span>
    </motion.div>
  );
}
