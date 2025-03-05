import type { GeneratedCAD } from "./types"

const SYSTEM_PROMPT = `
You are a professional CAD model generator that converts text descriptions into beautiful, detailed 3D models composed of primitive shapes.
Analyze the description and create a visually appealing 3D model using cubes, spheres, cylinders, and cones.
Consider spatial relationships, proportions, and engineering principles in your design. Make the models look professional and aesthetically pleasing.

Your response must be valid JSON with this structure:
{
  "objects": [
    {
      "type": "cube" | "sphere" | "cylinder" | "cone",
      "position": { "x": number, "y": number, "z": number },
      "rotation": { "x": number, "y": number, "z": number },
      "scale": { "x": number, "y": number, "z": number },
      "color": string (hex color code with good contrast and pleasant aesthetics),
      "name": string (descriptive name of the part)
    },
    ...
  ],
  "metadata": {
    "title": string (name of the model),
    "description": string (brief description of the model),
    "category": string (e.g., "furniture", "mechanical", "architecture", etc.)
  }
}

Guidelines:
1. Use precise measurements. Assume 1 unit = 1 cm.
2. Position (0,0,0) is the center of the model.
3. Consider how parts connect and interact - ensure they align properly.
4. Use rotation in radians.
5. Provide descriptive names for each part.
6. Use a harmonious, professional color palette (primarily use hex color codes like #4285F4, #EA4335, #FBBC05, #34A853, etc.) for visual appeal.
7. Consider the functionality and practicality of the design.
8. Create models with appropriate level of detail - include small connecting parts where appropriate.
9. Ensure good contrast between adjacent parts for visual clarity.
10. Position objects to create a balanced, visually appealing composition.
11. For complex models, use hierarchical organization of parts.
12. Use appropriate scale proportions that match real-world objects.
`

function evaluateExpressions(obj: any): any {
  if (typeof obj === "object" && obj !== null) {
    for (const key in obj) {
      obj[key] = evaluateExpressions(obj[key])
    }
  } else if (typeof obj === "string" && obj.includes("Math.")) {
    try {
      return eval(obj)
    } catch (error) {
      console.error("Error evaluating expression:", obj)
      return obj
    }
  }
  return obj
}

// Direct OpenAI API call without using the AI SDK
export async function generateCADModel(prompt: string, customApiKey?: string): Promise<GeneratedCAD> {
  try {
    console.log("========= AI SERVICE DIAGNOSTICS =========");
    console.log("Starting CAD model generation at:", new Date().toISOString());
    console.log("Prompt length:", prompt.length);
    console.log("Prompt preview:", prompt.substring(0, 50) + "...");
    
    // Use either the provided API key or try to get it from env
    let apiKey = customApiKey || process.env.OPENAI_API_KEY;
    
    // Log info for debugging
    console.log("API Key source:", customApiKey ? "direct input" : "environment variable");
    console.log("API Key exists:", !!apiKey);
    console.log("API Key type:", typeof apiKey);
    console.log("API Key length:", apiKey ? apiKey.length : 0);
    
    if (apiKey) {
      // Safe logging of API key parts to verify it's correct
      console.log("API Key first 4 chars:", apiKey.substring(0, 4));
      console.log("API Key last 4 chars:", apiKey.substring(apiKey.length - 4));
      
      // Check if it might be a placeholder or invalid format
      if (apiKey.includes("${OPENAI")) {
        console.error("ERROR: API key contains '${OPENAI' literal - variable substitution failed!");
      } else if (apiKey.includes("REPLACE_WITH_YOUR")) {
        console.error("ERROR: API key is still a placeholder!");
      } else if (!apiKey.startsWith("sk-")) {
        console.error("WARNING: API key doesn't start with 'sk-' - might not be a valid OpenAI key!");
      }
    }
    
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set in environment variables or provided directly");
      throw new Error("OpenAI API key is not configured");
    }
    
    // Fixed OpenAI API URL and model since environment variables might be the issue
    const baseUrl = "https://api.openai.com/v1";
    const modelName = "gpt-3.5-turbo"; // Try a different model as a test
    
    console.log("Using OpenAI API URL:", baseUrl);
    console.log("Using model:", modelName);
    console.log("==========================================");

    try {
      // Make a direct fetch call to OpenAI API
      console.log("Making OpenAI API request...");
      
      const requestBody = {
        model: modelName,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Create a detailed 3D CAD model for: ${prompt}. Consider spatial relationships, functionality, and engineering principles in your design.` }
        ],
        temperature: 0.7,
        max_tokens: 2000
      };
      
      console.log("Request body:", JSON.stringify(requestBody).substring(0, 200) + "...");
      
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        cache: "no-store" // Ensure no caching issues
      });

      console.log("OpenAI API response received");
      console.log("Response status:", response.status);
      console.log("Response status text:", response.statusText);
      console.log("Response headers:", JSON.stringify(Object.fromEntries([...response.headers.entries()])));
      
      // Get response text regardless of success for better error reporting
      const responseText = await response.text();
      console.log("Response text length:", responseText.length);
      console.log("Response text preview:", responseText.substring(0, 200) + "...");
      
      if (!response.ok) {
        console.error("OpenAI API error:", response.status, responseText);
        throw new Error(`OpenAI API error: Status ${response.status} - ${responseText.substring(0, 200)}`);
      }
      
      // Parse JSON after we've verified it's a successful response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("Failed to parse OpenAI response as JSON:", jsonError);
        throw new Error("Invalid JSON response from OpenAI API");
      }
      
      console.log("OpenAI response received and parsed successfully");
      
      const content = data.choices && data.choices[0]?.message?.content;
      
      if (!content) {
        console.error("Invalid response from OpenAI API:", data);
        throw new Error("Invalid response from OpenAI API: missing content");
      }
      
      console.log("Processing JSON response");

      const jsonMatch =
        content.match(/```json\n([\s\S]*?)\n```/) ||
        content.match(/```\n([\s\S]*?)\n```/) ||
        content.match(/\{[\s\S]*\}/);
        
      if (!jsonMatch) {
        console.error("No valid JSON found in response:", content);
        throw new Error("Invalid response format: no JSON found in content");
      }

      let jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      jsonString = jsonString.replace(/^```json\n|^```\n|```$/g, "").trim();

      try {
        const parsedJson = JSON.parse(jsonString);
        const evaluatedData = evaluateExpressions(parsedJson);

        if (!evaluatedData.objects || !Array.isArray(evaluatedData.objects)) {
          console.error("Invalid objects array in response:", evaluatedData);
          throw new Error("Invalid response format: missing or invalid objects array");
        }

        console.log("Successfully processed CAD model data with", evaluatedData.objects.length, "objects");
        
        return {
          objects: evaluatedData.objects,
          rawResponse: content
        };
      } catch (jsonError: any) {
        console.error("JSON parsing error:", jsonError, "Raw JSON:", jsonString);
        throw new Error(`Failed to parse model data: ${jsonError.message || "Unknown error"}`);
      }
    } catch (fetchError: any) {
      console.error("Fetch error when calling OpenAI API:", fetchError);
      throw new Error(`Error calling OpenAI API: ${fetchError.message || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Error generating CAD model:", error);
    // Pass the actual error message up
    throw error instanceof Error ? error : new Error("Failed to generate CAD model. Please try again.");
  }
}