
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, username } = await req.json();
    
    if (!message) {
      throw new Error("Message is required");
    }

    // Only apply rate limiting for anonymous users
    if (!userId) {
      const now = Date.now();
      const anonKey = `anon-${req.headers.get('x-real-ip') || 'unknown'}`;
      const rateData = rateLimits.get(anonKey) || { count: 0, resetAt: now + WINDOW_MS };
      
      if (now > rateData.resetAt) {
        rateData.count = 0;
        rateData.resetAt = now + WINDOW_MS;
      }
      
      if (rateData.count >= RATE_LIMIT) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Rate limit exceeded. Please try again in a minute or sign in for more requests." 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        });
      }
      
      rateData.count++;
      rateLimits.set(anonKey, rateData);
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Fetch user passions only if userId is provided
    let passions = ["AI", "entrepreneurship"]; // Default passions for anonymous users
    
    if (userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://gjwwzygpxigmhxugftse.supabase.co';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: userData, error: userError } = await supabase
        .from('Crafting Tomorrow Users')
        .select('passions')
        .eq('id', userId)
        .single();
        
      if (!userError && userData?.passions?.length) {
        passions = userData.passions;
      }
    }

    const systemPrompt = `You are MentorBot, a friendly advisor who explains AI and entrepreneurship through the lens of the ${username || 'user'}'s passions.
The user is passionate about: ${passions.join(', ')}.
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
    
    const aiResponse = openaiData.choices[0].message.content;

    return new Response(JSON.stringify({ 
      success: true, 
      message: aiResponse,
      remainingRequests: userId ? undefined : RATE_LIMIT - (rateLimits.get(anonKey)?.count || 0)
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

