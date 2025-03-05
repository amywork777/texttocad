"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { GeneratedCAD } from "./types"

const SYSTEM_PROMPT = `
You are an expert CAD model generator with deep knowledge of mechanical engineering and 3D design principles. Your task is to convert text descriptions into precise, physically accurate 3D models composed of primitive shapes.
Analyze the description carefully and create a detailed 3D model using cubes, spheres, cylinders, and cones.
Consider spatial relationships, proportions, engineering principles, material properties, and real-world physics in your design.

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

Guidelines for maximum accuracy:
1. Use precise measurements based on real-world dimensions. Assume 1 unit = 1 cm exactly.
2. Position (0,0,0) is the center of the model. Build outward from this origin point.
3. Ensure all parts connect and interact properly with appropriate tolerances and clearances.
4. Use rotation in radians with precise angles for proper alignment.
5. Provide detailed, descriptive names for each part reflecting their function.
6. Use realistic color hex codes that match typical materials for each component.
7. Prioritize functionality, structural integrity, and mechanical feasibility.
8. Consider weight distribution, center of gravity, and mechanical advantage in your design.
9. When appropriate, use mathematical expressions (e.g., Math.PI/2) for precise alignment.
10. Create the minimum number of parts needed for accuracy - avoid over-complication.
11. Ensure dimensions are proportionally accurate relative to each other.
12. Consider standard engineering tolerances for fits between moving parts.
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

export async function generateCADModel(prompt: string): Promise<GeneratedCAD> {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      throw new Error("OpenAI API key is not configured");
    }

    console.log("Starting CAD model generation with prompt:", prompt.substring(0, 50) + "...");
    
    // Use GPT-4o model as requested
    const response = await generateText({
      model: openai("gpt-4o"),
      system: SYSTEM_PROMPT,
      prompt: `Create a detailed 3D CAD model for: ${prompt}. Consider spatial relationships, functionality, and engineering principles in your design.`,
      temperature: 0.7,
      maxTokens: 2000,
    })

    console.log("OpenAI response received, processing JSON");

    const jsonMatch =
      response.text.match(/```json\n([\s\S]*?)\n```/) ||
      response.text.match(/```\n([\s\S]*?)\n```/) ||
      response.text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.error("No valid JSON found in response:", response.text);
      throw new Error("Invalid response format: no JSON found");
    }

    let jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response.text
    jsonString = jsonString.replace(/^```json\n|^```\n|```$/g, "").trim()

    try {
      const parsedJson = JSON.parse(jsonString);
      const evaluatedData = evaluateExpressions(parsedJson);

      if (!evaluatedData.objects || !Array.isArray(evaluatedData.objects)) {
        console.error("Invalid objects array in response:", evaluatedData);
        throw new Error("Invalid response format: missing objects array");
      }

      return {
        objects: evaluatedData.objects,
        rawResponse: response.text,
      }
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError, "Raw JSON:", jsonString);
      throw new Error("Failed to parse model data");
    }
  } catch (error) {
    console.error("Error generating CAD model:", error)
    throw new Error("Failed to generate CAD model. Please try again.")
  }
}