
import { useEffect } from "react";
import { motion } from "framer-motion";

const SplashScreen = () => {
  // Track that the app has been opened
  useEffect(() => {
    localStorage.setItem("appOpenedBefore", "true");
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ct-paper">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="text-center"
      >
        <div className="flex flex-col items-center justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, -3, 3, -3, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
            className="mb-6"
          >
            <img 
              src="/lovable-uploads/1f302f75-8271-4dc4-a10c-50186bf74e9a.png" 
              alt="Crafting Tomorrow Logo"
              className="w-40 h-40 object-contain" 
            />
          </motion.div>
          <motion.h1 
            className="text-3xl font-bold font-poppins mt-4 text-gray-800"
            animate={{ opacity: [0, 1] }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Crafting Tomorrow
          </motion.h1>
          <motion.p 
            className="text-gray-600 mt-2"
            animate={{ opacity: [0, 1] }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Your journey to entrepreneurship begins here
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
