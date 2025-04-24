
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      throw new Error("OpenAI API key is not configured");
    }

    // Check if we have passions
    if (!passions || !Array.isArray(passions) || passions.length === 0) {
      throw new Error("No passions provided");
    }

    // Limit passions to 6
    const limitedPassions = passions.slice(0, 6);
    
    // Create OpenAI prompt
    const prompt = `
      Create a personalized learning path for a student interested in AI entrepreneurship with these passions: ${limitedPassions.join(', ')}.
      Design a 6-lesson curriculum that connects AI concepts and entrepreneurship principles with these specific interests.
      
      For each lesson, provide:
      1. A title that clearly connects AI/entrepreneurship with one of their passions
      2. The lesson format (choose from: video, quiz, or scenario)
      3. A logical sequence number (1-6)
      4. XP awarded for completion (between 10-30)
      5. XP required to unlock (first lesson = 0, then increase gradually)
      
      Return the data as a valid JSON array of lesson objects with these exact fields:
      [
        {
          "sequence_no": number,
          "title": string,
          "type": string, (video, quiz, or scenario)
          "unlock_xp": number,
          "xp_reward": number
        },
        ...
      ]
      Only return the JSON array, nothing else.
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
            content: 'You are an AI curriculum designer specialized in creating personalized learning paths.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const openaiResponse = await response.json();
    const generatedContent = openaiResponse.choices[0].message.content;
    
    // Parse the JSON response
    let lessons;
    try {
      // Extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = generatedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                        generatedContent.match(/\[([\s\S]*?)\]/);
      
      const jsonString = jsonMatch ? jsonMatch[1] : generatedContent;
      lessons = JSON.parse(jsonString.includes('[') ? jsonString : `[${jsonString}]`);
    } catch (e) {
      console.error("Failed to parse OpenAI response:", e);
      throw new Error("Invalid response format from OpenAI");
    }

    // Return the generated lessons
    return new Response(
      JSON.stringify({
        lessons: lessons
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
    
  } catch (error) {
    console.error("Error:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
