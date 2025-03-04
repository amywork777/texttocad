"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
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

export async function generateCADModel(prompt: string): Promise<GeneratedCAD> {
  try {
    const response = await generateText({
      model: openai("gpt-4o"),
      system: SYSTEM_PROMPT,
      prompt: `Create a detailed 3D CAD model for: ${prompt}. Consider spatial relationships, functionality, and engineering principles in your design.`,
      temperature: 0.7,
      maxTokens: 2000,
    })

    const jsonMatch =
      response.text.match(/```json\n([\s\S]*?)\n```/) ||
      response.text.match(/```\n([\s\S]*?)\n```/) ||
      response.text.match(/\{[\s\S]*\}/)

    let jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response.text
    jsonString = jsonString.replace(/^```json\n|^```\n|```$/g, "").trim()

    const evaluatedData = evaluateExpressions(JSON.parse(jsonString))

    if (!evaluatedData.objects || !Array.isArray(evaluatedData.objects)) {
      throw new Error("Invalid response format: missing objects array")
    }

    return {
      objects: evaluatedData.objects,
      rawResponse: response.text,
    }
  } catch (error) {
    console.error("Error generating CAD model:", error)
    throw new Error("Failed to generate CAD model. Please try again.")
  }
}

