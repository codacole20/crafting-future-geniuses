
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define response headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting variables
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const AUTHENTICATED_LIMIT = 10;  // 10 requests per minute for authenticated users
const ANONYMOUS_LIMIT = 5;       // 5 requests per minute for anonymous users

// Rate limiting function
function isRateLimited(id: string, isAuthenticated: boolean) {
  const now = Date.now();
  const userLimit = isAuthenticated ? AUTHENTICATED_LIMIT : ANONYMOUS_LIMIT;
  
  if (!rateLimits.has(id)) {
    rateLimits.set(id, { count: 1, timestamp: now });
    return false;
  }
  
  const userRateLimit = rateLimits.get(id);
  
  // Reset if window has passed
  if (now - userRateLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimits.set(id, { count: 1, timestamp: now });
    return false;
  }
  
  // Increment count
  userRateLimit.count += 1;
  rateLimits.set(id, userRateLimit);
  
  // Check if over limit
  return userRateLimit.count > userLimit;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { message, userId, guestId, passions } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // Validate input
    if (!message) {
      throw new Error("Message is required");
    }
    
    // Check rate limits
    const id = userId || guestId || req.headers.get('x-forwarded-for') || 'anonymous';
    const isAuthenticated = !!userId;
    
    if (isRateLimited(id, isAuthenticated)) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later." 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }
    
    // Format passions for the system prompt
    const passionsText = passions && passions.length > 0
      ? `The user is interested in these topics: ${passions.join(', ')}. Try to relate your answers to these interests when relevant.`
      : "Try to make your answers relevant to the user's interests when possible.";
    
    // Create the system prompt
    const systemPrompt = `
      You are a helpful AI tutor specializing in AI and entrepreneurship education.
      ${passionsText}
      
      Guidelines:
      1. Keep your answers concise, practical, and project-oriented.
      2. Assume the user may be new to AI and entrepreneurship concepts - explain terms when needed.
      3. When giving examples, try to anchor them in at least one of the user's interests.
      4. Provide actionable advice that can be immediately applied.
      5. If asked about specific tools or technologies, suggest options with their pros and cons.
      6. Be encouraging and supportive of the user's learning journey.
    `;
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const openaiResponse = await response.json();
    const aiReply = openaiResponse.choices[0].message.content;

    // Return the AI's response
    return new Response(
      JSON.stringify({
        reply: aiReply,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
    
  } catch (error) {
    console.error("Error in AI chat function:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
