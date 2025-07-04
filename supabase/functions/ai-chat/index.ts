
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
      console.error("OpenAI API key is not configured");
      return new Response(
        JSON.stringify({ 
          error: "No OpenAI key configured. Please add OPENAI_API_KEY to the secrets." 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }
    
    // Validate input
    if (!message) {
      throw new Error("Message is required");
    }
    
    // Check rate limits - ensure we accept all users (guest or authenticated)
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
    
    // Format passions for the system prompt - ensure we always have a list
    const userPassions = Array.isArray(passions) && passions.length > 0
      ? passions.slice(0, 6)  // Limit to 6 passions
      : ["Technology", "Business"];
    
    const passionsText = `The user is interested in these topics: ${userPassions.join(', ')}. Try to relate your answers to these interests when relevant.`;
    
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
    
    console.log("Calling OpenAI API with key:", openAIApiKey ? "Key exists" : "No key found");
    
    // Call OpenAI API with optimized parameters
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
        max_tokens: 150      // Limiting tokens as requested
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorStatus = response.status;
      console.error(`OpenAI API error (${errorStatus}):`, JSON.stringify(errorData));
      
      // Handle specific error statuses
      if (errorStatus === 401) {
        return new Response(
          JSON.stringify({ error: "Authentication error: Invalid OpenAI API key" }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        );
      } else if (errorStatus === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded on OpenAI API" }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          }
        );
      }
      
      throw new Error(`OpenAI API error (${errorStatus}): ${JSON.stringify(errorData)}`);
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
