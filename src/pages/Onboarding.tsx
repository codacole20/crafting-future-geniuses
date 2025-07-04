import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { saveUserPassions, buildPersonalLearningPath } from "@/utils/openai";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { passionOptions } from "@/constants/passions";

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPassions, setSelectedPassions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePassionToggle = (id: string) => {
    if (selectedPassions.includes(id)) {
      setSelectedPassions(selectedPassions.filter(passionId => passionId !== id));
    } else {
      if (selectedPassions.length >= 6) {
        toast({
          title: "Maximum 6 passions allowed",
          description: "Please remove one before adding another."
        });
        return;
      }
      setSelectedPassions([...selectedPassions, id]);
    }
  };

  const handleContinue = async () => {
    if (selectedPassions.length === 0) {
      toast({
        title: "Please select at least one interest",
        description: "This helps us personalize your learning journey."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const guestId = uuidv4();
      localStorage.setItem("guestId", guestId);
      
      await saveUserPassions(selectedPassions, null);
      
      await buildPersonalLearningPath(selectedPassions, null);
      
      toast({
        title: "Your learning path is ready!",
        description: "Let's begin your entrepreneurial journey."
      });
      
      onComplete();
      navigate("/");
    } catch (error) {
      console.error("Error during onboarding:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again."
      });
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
        <p className="text-gray-600 text-center mb-4">
          Tell us what you're passionate about so we can create your personalized learning journey.
        </p>
        <p className="text-gray-600 text-center mb-8 text-sm">
          Select up to 6 interests that excite you.
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

        <div className="text-sm text-center text-gray-500 mb-6">
          {selectedPassions.length} / 6 interests selected
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
