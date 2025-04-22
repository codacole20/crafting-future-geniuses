
import { Tooltip } from "@radix-ui/react-tooltip";

interface LessonCardProps {
  locked: boolean;
  title: string;
  tagIcon: string;
  tagLabel: string;
  xpReward: number;
  onClick: () => void;
  remainingXp: number;
}

export default function LessonCard({
  locked,
  title,
  tagIcon,
  tagLabel,
  xpReward,
  onClick,
  remainingXp,
}: LessonCardProps) {
  return (
    <div
      className={`w-[85%] mx-auto rounded-card shadow-ct flex flex-col px-4 py-3 transition-all 
        ${locked ? "bg-[#F4F4F4]/40 cursor-not-allowed" : "bg-white cursor-pointer"}
      `}
      onClick={locked ? undefined : onClick}
      style={{ marginTop: -6, marginBottom: 0 }}
    >
      <div className="font-poppins font-semibold text-base text-gray-900">{title}</div>
      <div className="flex justify-between items-center mt-1">
        <div className="flex items-center gap-2 text-[#7BB3E5] text-sm font-poppins">
          <span className="text-lg">{tagIcon}</span>
          <span>{tagLabel}</span>
        </div>
        <span className="ml-auto">
          <span className="bg-[#E8F9FF] text-[#A2E3F4] font-poppins px-3 py-[2.5px] rounded-pill font-semibold text-xs shadow-sm">
            +{xpReward} XP
          </span>
        </span>
      </div>
      {locked && (
        <div className="mt-2">
          <div className="text-xs text-[#EBC367] font-poppins flex items-center">
            <svg width="14" height="14" className="mr-1" fill="#EBC367" viewBox="0 0 20 20"><path d="M10 2a4 4 0 0 1 4 4v2H6V6a4 4 0 0 1 4-4zm-1 9.268V13h2v-1.732c.585-.343 1-.98 1-1.732A2 2 0 1 0 9 10.536z"/></svg>
            {remainingXp > 0 ? (
              <span>Earn {remainingXp} XP to unlock this quest.</span>
            ) : (
              <span>Locked quest</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
