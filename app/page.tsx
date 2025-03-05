"use client"

import { useState, Suspense } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card"
import { Textarea } from "../components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Loader2, Lightbulb } from "lucide-react"
import dynamic from "next/dynamic"
import type { CADObject } from "../lib/types"

const CADRenderer = dynamic(() => import("../components/cad-renderer"), { 
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[400px] flex items-center justify-center">Loading 3D renderer...</div>
})

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [cadObjects, setCADObjects] = useState<CADObject[]>([])
  const [error, setError] = useState<string | null>(null)
  const [aiResponse, setAiResponse] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)

    try {
      console.log("Making API request to /api/generate with prompt:", prompt.substring(0, 30) + "...");
      
      const response = await fetch("/api/generate/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      console.log("API response status:", response.status);
      
      // Try to get the error message from the response
      let errorMessage = "Failed to generate CAD model";
      try {
        const errorData = await response.clone().json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }
      
      if (!response.ok) {
        throw new Error(errorMessage);
      }

      const result = await response.json()
      console.log("API response data received successfully");
      
      setCADObjects(result.objects || [])
      setAiResponse(result.rawResponse || null)
    } catch (err) {
      console.error("Error in handleGenerate:", err);
      setError(err instanceof Error ? err.message : "Failed to generate CAD model. Please try again.");
    } finally {
      setIsGenerating(false)
    }
  }

  const examplePrompts = [
    "A simple gear mechanism with 2 interlocking gears",
    "A basic chair design with a seat, backrest, and four legs",
    "A coffee mug with a handle and saucer",
    "A simple robot arm with 3 joints and a gripper",
  ]

  return (
    <main className="container mx-auto p-4 min-h-screen flex flex-col bg-gradient-to-br from-buildfish-mint/10 via-transparent to-buildfish-sunshine/10">
      <header className="py-6">
        <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-buildfish-oxford to-buildfish-sunset bg-clip-text text-transparent">
          BuildFish AI
        </h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Transform your ideas into 3D models with AI-powered precision
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <Card className="lg:col-span-1 border-buildfish-mint/20">
          <CardHeader>
            <CardTitle className="font-heading text-buildfish-oxford">Model Description</CardTitle>
            <CardDescription>Describe the 3D object or mechanism you want to create</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Describe your 3D model here..."
              className="min-h-[150px] border-buildfish-mint/20 focus-visible:ring-buildfish-mint"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2 font-heading">Example prompts:</h3>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((example, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(example)}
                    className="text-xs border-buildfish-sunset/20 hover:bg-buildfish-sunset/10"
                  >
                    <Lightbulb className="h-3 w-3 mr-1 text-buildfish-sunset" />
                    {example.length > 30 ? example.substring(0, 30) + "..." : example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-buildfish-oxford hover:bg-buildfish-oxford/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate CAD Model"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-2 border-buildfish-mint/20">
          <Tabs defaultValue="model">
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle className="font-heading text-buildfish-oxford">CAD Model</CardTitle>
                <TabsList className="bg-buildfish-mint/10">
                  <TabsTrigger
                    value="model"
                    className="data-[state=active]:bg-buildfish-mint data-[state=active]:text-buildfish-oxford"
                  >
                    Model
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="data-[state=active]:bg-buildfish-mint data-[state=active]:text-buildfish-oxford"
                  >
                    Details
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <TabsContent value="model" className="m-0">
                <div className="w-full h-[500px] rounded-md overflow-hidden">
                  {error ? (
                    <div className="h-full flex items-center justify-center text-red-500 p-4 text-center">{error}</div>
                  ) : cadObjects.length > 0 ? (
                    <CADRenderer objects={cadObjects} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Enter a description and click Generate to create your CAD model
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="details" className="m-0">
                <div className="p-4 h-[500px] overflow-auto font-mono text-xs">
                  {aiResponse ? (
                    <pre className="whitespace-pre-wrap">{aiResponse}</pre>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Generate a model to see the AI response details
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </main>
  )
}

