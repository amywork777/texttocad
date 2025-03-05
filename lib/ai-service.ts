"use server"

import type { GeneratedCAD } from "./types"

const SYSTEM_PROMPT = `
You are a CAD model generator that converts text descriptions into 3D models composed of primitive shapes.
Analyze the description and create a detailed 3D model using cubes, spheres, cylinders, and cones.
Consider spatial relationships, proportions, and engineering principles in your design.

Your response must be valid JSON with this structure:
{
  "objects": [
    {
      "type": "cube" | "sphere" | "cylinder" | "cone",
      "position": { "x": number, "y": number, "z": number },
      "rotation": { "x": number, "y": number, "z": number },
      "scale": { "x": number, "y": number, "z": number },
      "color": string (hex color code),
      "name": string
    },
    ...
  ]
}

Guidelines:
1. Use precise measurements. Assume 1 unit = 1 cm.
2. Position (0,0,0) is the center of the model.
3. Consider how parts connect and interact.
4. Use rotation in radians.
5. Provide descriptive names for each part.
6. Use color to differentiate parts (use hex color codes).
7. Consider the functionality and practicality of the design.
8. Aim for a balance between detail and simplicity.
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
export async function generateCADModel(prompt: string): Promise<GeneratedCAD> {
  try {
    console.log("Starting CAD model generation with prompt:", prompt.substring(0, 50) + "...");
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      throw new Error("OpenAI API key is not configured");
    }
    
    console.log("OpenAI API key available");
    
    const baseUrl = process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1";
    const modelName = process.env.NEXT_PUBLIC_DEFAULT_MODEL || "gpt-4o";
    
    console.log("Using OpenAI API URL:", baseUrl);
    console.log("Using model:", modelName);

    // Make a direct fetch call to OpenAI API
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Create a detailed 3D CAD model for: ${prompt}. Consider spatial relationships, functionality, and engineering principles in your design.` }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("OpenAI response received");
    
    const content = data.choices && data.choices[0]?.message?.content;
    
    if (!content) {
      console.error("Invalid response from OpenAI API:", data);
      throw new Error("Invalid response from OpenAI API");
    }
    
    console.log("Processing JSON response");

    const jsonMatch =
      content.match(/```json\n([\s\S]*?)\n```/) ||
      content.match(/```\n([\s\S]*?)\n```/) ||
      content.match(/\{[\s\S]*\}/);
      
    if (!jsonMatch) {
      console.error("No valid JSON found in response:", content);
      throw new Error("Invalid response format: no JSON found");
    }

    let jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
    jsonString = jsonString.replace(/^```json\n|^```\n|```$/g, "").trim();

    try {
      const parsedJson = JSON.parse(jsonString);
      const evaluatedData = evaluateExpressions(parsedJson);

      if (!evaluatedData.objects || !Array.isArray(evaluatedData.objects)) {
        console.error("Invalid objects array in response:", evaluatedData);
        throw new Error("Invalid response format: missing objects array");
      }

      return {
        objects: evaluatedData.objects,
        rawResponse: content
      };
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError, "Raw JSON:", jsonString);
      throw new Error("Failed to parse model data");
    }
  } catch (error) {
    console.error("Error generating CAD model:", error);
    throw new Error("Failed to generate CAD model. Please try again.");
  }
}