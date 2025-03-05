import { type NextRequest, NextResponse } from "next/server"
import { generateCADModel } from "@/lib/ai-service"

// Force dynamic to prevent caching issues
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure we're using Node.js runtime

// IMPORTANT: We rely on env variables set in the Vercel dashboard

export async function POST(req: NextRequest) {
  try {
    console.log("==================== API ROUTE DIAGNOSTICS ====================");
    console.log("API route called at:", new Date().toISOString());
    console.log("Runtime environment:", process.env.NODE_ENV);
    console.log("Vercel environment:", process.env.VERCEL_ENV);
    
    // Check all environment variables (safely)
    const envVars = Object.keys(process.env).sort();
    console.log("Available environment variables:", envVars.join(", "));
    
    // Safe check for API key (don't log the actual key)
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("OPENAI_API_KEY exists:", !!apiKey);
    console.log("OPENAI_API_KEY type:", typeof apiKey);
    console.log("OPENAI_API_KEY length:", apiKey ? apiKey.length : 0);
    
    if (apiKey) {
      // Log some safe parts of the key to check if it's correct
      console.log("OPENAI_API_KEY first 4 chars:", apiKey.substring(0, 4));
      console.log("OPENAI_API_KEY last 4 chars:", apiKey.substring(apiKey.length - 4));
    }
    console.log("================================================================");
    
    // Parse the request body
    let prompt;
    try {
      const body = await req.json();
      prompt = body.prompt;
      console.log("Request prompt:", prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt);
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Get the API key directly from the env
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "OpenAI API key is not configured on the server" },
        { status: 500 }
      );
    }
    
    // Generate the CAD model using the API key
    console.log("Calling generateCADModel with prompt...");
    const result = await generateCADModel(prompt, apiKey);
    console.log("Successfully generated CAD model with", result.objects.length, "objects");
    
    // Enhance the response with additional information
    const enhancedResponse = {
      objects: result.objects,
      metadata: result.metadata || {
        title: prompt.length > 30 ? `${prompt.substring(0, 30)}...` : prompt,
        description: `3D model created from prompt: ${prompt}`,
        category: "generated",
        createdAt: new Date().toISOString()
      },
      rawResponse: result.rawResponse,
      generation: {
        prompt,
        timestamp: new Date().toISOString(),
        status: "success"
      }
    };
    
    return NextResponse.json(enhancedResponse);
  } catch (error) {
    console.error("Error in generate API route:", error);
    
    // Get detailed error message
    const errorMessage = error instanceof Error ? error.message : "Failed to generate CAD model";
    console.error("Error details:", errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    )
  }
} 