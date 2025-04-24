
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const { passions, userId } = await req.json();
    
    if (!passions || !Array.isArray(passions) || passions.length === 0) {
      throw new Error("Invalid passions array");
    }
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    console.log(`Generating lesson plan for user ${userId} with passions: ${passions.join(', ')}`);

    // Create system and user prompts
    const systemPrompt = "You are a curriculum designer for teens learning AI + entrepreneurship.";
    const userPrompt = `The student's passions are: ${passions.map(p => `• ${p}`).join(' ')}.
Create a 6-lesson micro-course that blends these passions with AI-powered entrepreneurship concepts.
For each lesson, output:
  – title
  – lesson_type ("video", "quiz", or "scenario")
  – xp_reward (int: 10 for video, 15 for quiz, 20 for scenario)
  – short description (≤ 25 words)
Return the lessons as JSON in array form only.`;

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
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    const openaiData = await response.json();
    
    if (!openaiData.choices || !openaiData.choices[0].message) {
      throw new Error("Invalid response from OpenAI");
    }
    
    // Extract the AI-generated content
    const content = openaiData.choices[0].message.content;
    console.log("OpenAI response:", content);

    // Parse JSON from the response
    // Find the first occurrence of '[' and the last occurrence of ']'
    let jsonStart = content.indexOf('[');
    let jsonEnd = content.lastIndexOf(']');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Could not find JSON array in OpenAI response");
    }

    const jsonString = content.substring(jsonStart, jsonEnd + 1);
    const lessons = JSON.parse(jsonString);
    
    if (!Array.isArray(lessons) || lessons.length === 0) {
      throw new Error("Invalid lessons data format");
    }
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://gjwwzygpxigmhxugftse.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clear existing lessons for this user
    const { error: deleteError } = await supabase
      .from('lessons')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) {
      console.error("Error deleting existing lessons:", deleteError);
      throw new Error("Failed to clear existing lessons");
    }

    // Insert new lessons
    const lessonsToInsert = lessons.map((lesson, index) => ({
      title: lesson.title,
      type: lesson.lesson_type,
      description: lesson.short_description,
      xp_reward: lesson.xp_reward,
      sequence_no: index + 1,
      unlock_xp: index === 0 ? 0 : 10 * index,
      completed: false,
      user_id: userId
    }));
    
    const { error: insertError } = await supabase
      .from('lessons')
      .insert(lessonsToInsert);
      
    if (insertError) {
      console.error("Error inserting lessons:", insertError);
      throw new Error("Failed to save new lessons");
    }

    return new Response(JSON.stringify({ success: true, lessons: lessonsToInsert }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error generating lesson plan:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Failed to generate lesson plan" 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
