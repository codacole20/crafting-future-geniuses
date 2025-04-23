
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface OnboardingProps {
  onComplete: () => void;
}

// Sample passion options
const passionOptions = [
  { id: "tech", label: "Technology" },
  { id: "business", label: "Business" },
  { id: "art", label: "Art & Design" },
  { id: "environment", label: "Environment" },
  { id: "education", label: "Education" },
  { id: "health", label: "Health & Fitness" },
  { id: "social", label: "Social Impact" },
  { id: "finance", label: "Finance" },
  { id: "gaming", label: "Gaming" },
  { id: "music", label: "Music & Audio" },
  { id: "writing", label: "Writing" },
  { id: "fashion", label: "Fashion" },
];

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const navigate = useNavigate();
  const [selectedPassions, setSelectedPassions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePassionToggle = (id: string) => {
    if (selectedPassions.includes(id)) {
      setSelectedPassions(selectedPassions.filter(passionId => passionId !== id));
    } else {
      setSelectedPassions([...selectedPassions, id]);
    }
  };

  const handleContinue = async () => {
    if (selectedPassions.length === 0) {
      return; // Require at least one passion
    }

    setIsSubmitting(true);

    try {
      // Here we would normally call an API to generate learning plan
      // For MVP, we'll simulate this with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store selected passions
      localStorage.setItem("userPassions", JSON.stringify(selectedPassions));
      
      // Complete onboarding
      onComplete();
      navigate("/");
    } catch (error) {
      console.error("Error during onboarding:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ct-paper p-6 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-semibold text-center mb-2 font-poppins">Welcome!</h1>
        <p className="text-gray-600 text-center mb-8">
          Tell us what you're passionate about so we can create your personalized learning journey.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {passionOptions.map((passion) => (
            <motion.div
              key={passion.id}
              whileTap={{ scale: 0.95 }}
              className={`
                p-4 rounded-card flex items-center border cursor-pointer shadow-ct transition-colors
                ${selectedPassions.includes(passion.id) 
                  ? 'border-ct-teal bg-ct-teal/10' 
                  : 'border-gray-200 bg-ct-white hover:bg-gray-50'}
              `}
              onClick={() => handlePassionToggle(passion.id)}
              role="checkbox"
              aria-checked={selectedPassions.includes(passion.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePassionToggle(passion.id);
                }
              }}
            >
              <Checkbox 
                id={passion.id}
                checked={selectedPassions.includes(passion.id)}
                className="pointer-events-none mr-2"
              />
              <label 
                htmlFor={passion.id} 
                className="cursor-pointer flex-1 select-none"
                onClick={(e) => e.preventDefault()}
              >
                {passion.label}
              </label>
            </motion.div>
          ))}
        </div>

        <Button 
          onClick={handleContinue} 
          disabled={selectedPassions.length === 0 || isSubmitting}
          className="w-full bg-ct-teal hover:bg-ct-teal/90 text-white font-medium py-3 rounded-pill shadow-ct"
        >
          {isSubmitting ? "Creating your path..." : "Continue"}
        </Button>
      </motion.div>
    </div>
  );
};

export default Onboarding;
