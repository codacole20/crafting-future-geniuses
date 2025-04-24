
import { supabase } from "@/integrations/supabase/client";

// Define types for OpenAI responses
export interface GeneratedLesson {
  sequence_no: number;
  title: string;
  type: string;
  unlock_xp: number;
  xp_reward: number;
}

/**
 * Store user passions in localStorage or Supabase based on authentication status
 */
export const saveUserPassions = async (passions: string[], userId?: string | null) => {
  // Always store in localStorage for immediate access
  localStorage.setItem("userPassions", JSON.stringify(passions));
  
  try {
    if (userId) {
      // If authenticated, store in database
      await supabase.from('user_passions')
        .upsert({ 
          user_id: userId,
          passions,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id' 
        });
    } else {
      // For guest users, use session ID
      const guestId = localStorage.getItem("guestId") || crypto.randomUUID();
      localStorage.setItem("guestId", guestId);
      
      await supabase.from('user_passions')
        .upsert({ 
          guest_id: guestId,
          passions,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'guest_id' 
        });
    }
  } catch (error) {
    console.error("Error saving passions:", error);
  }
};

/**
 * Retrieve user passions from localStorage or Supabase based on authentication status
 */
export const getUserPassions = async (userId?: string | null): Promise<string[]> => {
  try {
    // Try to get from localStorage first for immediate access
    const localPassions = localStorage.getItem("userPassions");
    if (localPassions) {
      return JSON.parse(localPassions);
    }
    
    // If authenticated, try to get from database
    if (userId) {
      const { data, error } = await supabase
        .from('user_passions')
        .select('passions')
        .eq('user_id', userId)
        .single();
      
      if (data?.passions) {
        // Update localStorage for faster access next time
        localStorage.setItem("userPassions", JSON.stringify(data.passions));
        return data.passions;
      }
    } else {
      // For guest users, use guest ID
      const guestId = localStorage.getItem("guestId");
      if (guestId) {
        const { data, error } = await supabase
          .from('user_passions')
          .select('passions')
          .eq('guest_id', guestId)
          .single();
        
        if (data?.passions) {
          localStorage.setItem("userPassions", JSON.stringify(data.passions));
          return data.passions;
        }
      }
    }
    
    // Default passions if none found
    return ["Technology", "Business"];
    
  } catch (error) {
    console.error("Error fetching passions:", error);
    return ["Technology", "Business"]; // Default fallback
  }
};

/**
 * Build a personalized learning path based on user passions
 */
export const buildPersonalLearningPath = async (
  passions: string[], 
  userId?: string | null
): Promise<GeneratedLesson[]> => {
  try {
    // Limit to 6 passions maximum
    const limitedPassions = passions.slice(0, 6);
    
    // Create edge function payload
    const payload = {
      passions: limitedPassions,
      userId: userId || null,
      guestId: !userId ? localStorage.getItem("guestId") : null
    };
    
    // Call the edge function
    const { data, error } = await supabase.functions.invoke('generate-learning-path', {
      body: payload
    });
    
    if (error) throw error;
    
    return data.lessons;
    
  } catch (error) {
    console.error("Error generating learning path:", error);
    
    // Return fallback static learning path
    return [
      {
        sequence_no: 1,
        title: "Introduction to AI & Entrepreneurship",
        type: "video",
        unlock_xp: 0,
        xp_reward: 10
      },
      {
        sequence_no: 2,
        title: "Finding Your Niche",
        type: "quiz",
        unlock_xp: 10,
        xp_reward: 15
      },
      {
        sequence_no: 3,
        title: "Market Research Basics",
        type: "scenario",
        unlock_xp: 25,
        xp_reward: 20
      },
      {
        sequence_no: 4,
        title: "AI Tools for Entrepreneurs",
        type: "video",
        unlock_xp: 45,
        xp_reward: 15
      },
      {
        sequence_no: 5,
        title: "Creating Your MVP",
        type: "scenario",
        unlock_xp: 60,
        xp_reward: 25
      },
      {
        sequence_no: 6,
        title: "Launch Strategy",
        type: "video",
        unlock_xp: 85,
        xp_reward: 30
      }
    ];
  }
};
