"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card"
import { Textarea } from "../components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Loader2, Lightbulb, Mic, MicOff } from "lucide-react"
import dynamic from "next/dynamic"
import type { CADObject } from "../lib/types"

const CADRenderer = dynamic(() => import("../components/cad-renderer"), { 
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[400px] flex items-center justify-center">Loading 3D renderer...</div>
})

// Define a type for the SpeechRecognition API which isn't in the default TypeScript types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Define the constructor for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [cadObjects, setCADObjects] = useState<CADObject[]>([])
  const [error, setError] = useState<string | null>(null)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check if browser supports speech recognition
  useEffect(() => {
    const isBrowser = typeof window !== "undefined"
    setVoiceSupported(
      isBrowser && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition)
    )
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (!voiceSupported) return

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    
    if (recognitionRef.current) {
      const recognition = recognitionRef.current
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } 
        }

        if (finalTranscript) {
          setPrompt(prev => {
            // If there's already text, add a space before the new transcription
            const separator = prev.trim().length > 0 ? ' ' : ''
            return prev + separator + finalTranscript
          })
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event)
        setIsListening(false)
      }

      recognition.onend = () => {
        // Only set listening to false if we're not manually keeping it on
        if (!recognition.continuous) {
          setIsListening(false)
        }
      }
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.log('Error stopping recognition on unmount:', e)
        }
      }
    }
  }, [voiceSupported])

  const toggleListening = () => {
    if (!recognitionRef.current) return
    
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        // This can happen if recognition is already started
        console.log('Error starting recognition:', e)
        
        // Try to restart it
        recognitionRef.current.stop()
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.start()
            setIsListening(true)
          }
        }, 100)
      }
    }
  }

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
      setMetadata(result.metadata || null)
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
    <main className="container mx-auto p-4 min-h-screen flex flex-col bg-white">
      <header className="py-6">
        <h1 className="text-4xl font-bold font-heading text-slate-800">
          Text to 3D
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <Card className="lg:col-span-1 border shadow-md bg-white overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-slate-800 flex items-center gap-2">
              <span className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 2v8"></path><path d="m4.93 10.93 1.41 1.41"></path><path d="M2 18h2"></path><path d="M20 18h2"></path><path d="m19.07 10.93-1.41 1.41"></path><path d="M22 22H2"></path><path d="m16 6-4 4-4-4"></path><path d="M16 18a4 4 0 0 0-8 0"></path></svg>
              </span>
              Model Description
            </CardTitle>
            <CardDescription>Describe the 3D object or mechanism you want to create</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="relative">
              <Textarea
                placeholder="Describe your 3D model here..."
                className="min-h-[150px] border focus-visible:ring-slate-400 bg-white pr-10"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              {voiceSupported && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost" 
                  className={`absolute right-2 bottom-2 h-8 w-8 rounded-full ${isListening ? 'bg-red-100 text-red-600' : 'hover:bg-slate-100 text-slate-600'}`}
                  onClick={toggleListening}
                  disabled={isGenerating}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  <span className="sr-only">{isListening ? 'Stop dictation' : 'Start dictation'}</span>
                </Button>
              )}
            </div>

            {isListening && (
              <div className="mt-2 text-xs text-slate-700 bg-slate-100 p-2 rounded-md flex items-center">
                <Mic className="h-3 w-3 mr-1 animate-pulse" />
                Listening... speak now. Click the mic button again to stop.
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2 font-heading flex items-center gap-2">
                <span className="bg-slate-100 w-5 h-5 rounded-full flex items-center justify-center text-slate-600">
                  <Lightbulb className="h-3 w-3" />
                </span>
                Example prompts:
              </h3>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((example, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(example)}
                    className="text-xs border-slate-200 hover:bg-slate-100 bg-white"
                  >
                    <Lightbulb className="h-3 w-3 mr-1 text-slate-600" />
                    {example.length > 30 ? example.substring(0, 30) + "..." : example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-slate-800 hover:bg-slate-700 shadow-md transition-all duration-300 hover:translate-y-[-2px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                  Generate CAD Model
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-2 border shadow-md bg-white">
          <Tabs defaultValue="model">
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle className="font-heading text-slate-800 flex items-center gap-2">
                  <span className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>
                  </span>
                  CAD Model
                </CardTitle>
                <TabsList className="bg-slate-100">
                  <TabsTrigger
                    value="model"
                    className="data-[state=active]:bg-slate-600 data-[state=active]:text-white"
                  >
                    Model
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="data-[state=active]:bg-slate-600 data-[state=active]:text-white"
                  >
                    Details
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <TabsContent value="model" className="m-0">
                <div className="w-full h-[500px] rounded-md overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100">
                  {error ? (
                    <div className="h-full flex items-center justify-center bg-red-50 p-6">
                      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-red-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        </div>
                        <h3 className="text-lg font-semibold text-red-700 mb-2">Generation Error</h3>
                        <p className="text-gray-600">{error}</p>
                      </div>
                    </div>
                  ) : cadObjects.length > 0 ? (
                    <CADRenderer objects={cadObjects} metadata={metadata} />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-white">
                      <div className="text-center p-8 max-w-md">
                        <div className="mx-auto w-16 h-16 mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-slate-600"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">Ready to Generate</h3>
                        <p className="text-gray-500">Enter a description and click Generate to create your 3D model</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="details" className="m-0">
                <div className="p-4 h-[500px] overflow-auto font-mono text-xs bg-slate-900 text-slate-200">
                  {aiResponse ? (
                    <pre className="whitespace-pre-wrap p-4">{aiResponse}</pre>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
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

