"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { GeneratedCAD } from "./types"

const SYSTEM_PROMPT = `
You are a CAD model generator that converts text descriptions into 3D models composed of primitive shapes and CSG operations.
Analyze the description and create a detailed 3D model using primitive shapes (cubes, spheres, cylinders, and cones) combined with CSG operations.
Consider spatial relationships, proportions, and engineering principles in your design.

Your response must be valid JSON with this structure:
{
  "objects": [
    {
      "type": "cube" | "sphere" | "cylinder" | "cone" | "csg",
      "position": { "x": number, "y": number, "z": number },
      "rotation": { "x": number, "y": number, "z": number },
      "scale": { "x": number, "y": number, "z": number },
      "color": string (hex color code),
      "name": string,
      
      // For CSG operations (when type is "csg"):
      "operation": "union" | "subtract" | "intersect",
      "children": [
        // Array of objects that are combined with the CSG operation
        // Each child follows the same structure as regular objects
        {
          "type": "cube" | "sphere" | "cylinder" | "cone",
          "position": { "x": number, "y": number, "z": number },
          "rotation": { "x": number, "y": number, "z": number },
          "scale": { "x": number, "y": number, "z": number },
          "color": string (hex color code),
          "name": string
        },
        // More children...
      ]
    },
    // More objects...
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
9. Use CSG operations to create more complex shapes:
   - "union": combines two or more shapes (A + B)
   - "subtract": subtracts one shape from another (A - B)
   - "intersect": keeps only the overlapping portion of shapes (A ∩ B)
10. For CSG operations, position each child object relative to the parent CSG object.
11. Complex designs should use a combination of primitives and CSG operations.
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