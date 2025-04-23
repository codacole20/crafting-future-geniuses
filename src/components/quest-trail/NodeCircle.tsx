
import { Check, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function NodeCircle({
  state,
  sequence,
  highlight,
}: {
  state: "completed" | "unlocked" | "locked";
  sequence: number;
  highlight?: boolean;
}) {
  // Colors: Unlocked #7BB3E5, Completed #A2E3F4, Locked 2px #EBC367
  if (state === "completed") {
    return (
      <motion.div
        className="node-circle node-completed flex items-center justify-center"
        initial={highlight ? { scale: 0.85 } : false}
        animate={highlight ? { scale: [0.85, 1] } : undefined}
        transition={{ duration: 0.34, type: "spring" }}
        style={{ width: 44, height: 44, marginBottom: 8 }}
      >
        <Check size={28} color="#fff" />
      </motion.div>
    );
  }
  if (state === "locked") {
    return (
      <motion.div
        className="node-circle node-locked flex items-center justify-center"
        style={{
          width: 44,
          height: 44,
          marginBottom: 8,
          background: "transparent",
          border: "2px solid #EBC367",
          color: "#EBC367",
        }}
        initial={highlight ? { scale: 0.85 } : false}
        animate={highlight ? { scale: [0.85, 1] } : undefined}
        transition={{ duration: 0.34, type: "spring" }}
      >
        <Lock size={26} color="#EBC367" />
      </motion.div>
    );
  }
  // unlocked
  return (
    <motion.div
      className="node-circle node-unlocked flex items-center justify-center"
      style={{
        width: 44,
        height: 44,
        marginBottom: 8,
        background: "#7BB3E5",
        color: "#fff",
      }}
      initial={highlight ? { scale: 0.85 } : { scale: 1 }}
      animate={highlight ? { scale: [0.85, 1] } : undefined}
      transition={{ duration: 0.34, type: "spring" }}
    >
      <span className="text-base font-bold">{sequence}</span>
    </motion.div>
  );
}
