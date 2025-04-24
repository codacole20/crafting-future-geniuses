
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Define response headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { passions, userId, guestId } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      console.error("OpenAI API key is not configured");
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API key is not configured. Please add OPENAI_API_KEY to the secrets." 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    // Validate input
    if (!passions || !Array.isArray(passions) || passions.length === 0) {
      throw new Error("Valid passions array is required");
    }
    
    // Limit to 6 passions maximum
    const limitedPassions = passions.slice(0, 6);
    
    // Create system prompt for OpenAI
    const systemPrompt = `
      You are an AI specialized in creating personalized learning paths for entrepreneurship and AI.
      Create a learning path based on the following user interests: ${limitedPassions.join(', ')}.
      
      The learning path should:
      1. Blend AI concepts, entrepreneurship principles, and the user's interests
      2. Consist of exactly 6 lessons
      3. Include a mix of videos, quizzes, and scenarios
      4. Have a logical progression from basics to more advanced topics
      5. Be concretely related to at least one of the user's interests
      
      Return ONLY a JSON array with the following format for each lesson:
      [
        {
          "sequence_no": 1,
          "title": "Lesson Title",
          "type": "video", // or "quiz" or "scenario"
          "unlock_xp": 0, // XP required to unlock this lesson (0 for first lesson)
          "xp_reward": 10 // XP earned for completing this lesson
        },
        // ... more lessons
      ]
      
      Make sure XP values increase gradually. First lesson should have unlock_xp=0.
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
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const openaiResponse = await response.json();
    const responseContent = openaiResponse.choices[0].message.content;
    
    // Parse the response to extract the JSON array of lessons
    let lessons;
    try {
      // Check if the response is already a JSON object
      const parsedContent = JSON.parse(responseContent);
      lessons = parsedContent.length ? parsedContent : parsedContent.lessons;
      
      if (!Array.isArray(lessons)) {
        throw new Error("Invalid response format");
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      throw new Error("Failed to parse learning path from AI");
    }
    
    // Return the lessons
    return new Response(
      JSON.stringify({ lessons }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
    
  } catch (error) {
    console.error("Error in generate-learning-path function:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
