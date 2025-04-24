
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiting
const rateLimits = new Map();
const RATE_LIMIT = 5; // requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    
    if (!message || !userId) {
      throw new Error("Message and userId are required");
    }

    // Check rate limit
    const now = Date.now();
    const userKey = `user-${userId}`;
    const userRateData = rateLimits.get(userKey) || { count: 0, resetAt: now + WINDOW_MS };
    
    // Reset counter if window has expired
    if (now > userRateData.resetAt) {
      userRateData.count = 0;
      userRateData.resetAt = now + WINDOW_MS;
    }
    
    // Check if user has exceeded rate limit
    if (userRateData.count >= RATE_LIMIT) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Rate limit exceeded. Please try again in a minute." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      });
    }
    
    // Increment counter and save
    userRateData.count++;
    rateLimits.set(userKey, userRateData);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Set up Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://gjwwzygpxigmhxugftse.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user passions
    const { data: userData, error: userError } = await supabase
      .from('Crafting Tomorrow Users')
      .select('passions')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      throw new Error("Could not retrieve user data");
    }

    const passions = userData.passions || [];
    const passionsList = passions.length > 0 ? passions.join(', ') : "AI and entrepreneurship";

    // Create system prompt with user's passions
    const systemPrompt = `You are MentorBot, a friendly advisor who explains AI and entrepreneurship through the lens of the student's passions.
The student is passionate about: ${passionsList}.
Keep answers concise, concrete, and age-appropriate.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    const openaiData = await response.json();
    
    if (!openaiData.choices || !openaiData.choices[0].message) {
      throw new Error("Invalid response from OpenAI");
    }
    
    // Extract AI response
    const aiResponse = openaiData.choices[0].message.content;

    return new Response(JSON.stringify({ 
      success: true, 
      message: aiResponse,
      remainingRequests: RATE_LIMIT - userRateData.count
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in AI tutor chat:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "We're retrying—please wait a moment."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
