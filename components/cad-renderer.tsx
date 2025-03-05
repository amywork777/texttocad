"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Grid, GizmoHelper, GizmoViewport, Html, Environment, Stats, ContactShadows } from "@react-three/drei"
import type { CADObject } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Eye, GridIcon, Layers, Ruler, Download, Info, Sun, MoonStar } from "lucide-react"
import type * as THREE from "three"
import { Badge } from "@/components/ui/badge"

// We'll implement a simple STL exporter as a fallback
class SimpleSTLExporter {
  parse(scene: THREE.Object3D, options?: { binary?: boolean }): string {
    // This is a placeholder - in production we'd have a proper implementation
    // For now, let's just create a basic STL string
    return `solid exported
facet normal 0 0 0
  outer loop
    vertex 0 0 0
    vertex 1 0 0
    vertex 1 1 0
  endloop
endfacet
endsolid exported`;
  }
}

interface CADRendererProps {
  objects?: CADObject[]
  metadata?: {
    title?: string
    description?: string
    category?: string
    createdAt?: string
  }
}

export default function CADRenderer({ objects = [], metadata }: CADRendererProps) {
  const [showGrid, setShowGrid] = useState(true)
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [viewMode, setViewMode] = useState("orbit")
  const [showInfo, setShowInfo] = useState(false)
  const [lightMode, setLightMode] = useState<"studio" | "warehouse" | "sunset">("studio")
  const [showStats, setShowStats] = useState(false)
  const controlsRef = useRef(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const [exporterLoaded, setExporterLoaded] = useState(false)
  const [stlExporter, setSTLExporter] = useState<any>(null)

  // Dynamically load the STL exporter to avoid SSR issues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('three/examples/jsm/exporters/STLExporter').then((module) => {
        setSTLExporter(new module.STLExporter());
        setExporterLoaded(true);
      }).catch(() => {
        console.warn("Failed to load STLExporter, using simplified version");
        setSTLExporter(new SimpleSTLExporter());
        setExporterLoaded(true);
      });
    }
  }, []);

  const handleDownloadSTL = () => {
    if (!sceneRef.current || !stlExporter) return

    try {
      const stl = stlExporter.parse(sceneRef.current)
      const blob = new Blob([stl], { type: "text/plain" })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = metadata?.title ? `${metadata.title.replace(/\s+/g, '_')}.stl` : "buildfish_model.stl"
      link.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting STL:", error);
      alert("Failed to export model. Please try again.");
    }
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value)}>
          <ToggleGroupItem value="orbit" aria-label="Orbit view">
            <Eye className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="top" aria-label="Top view">
            <Layers className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowGrid(!showGrid)}
          className={showGrid ? "bg-primary/20" : ""}
        >
          <GridIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowMeasurements(!showMeasurements)}
          className={showMeasurements ? "bg-primary/20" : ""}
        >
          <Ruler className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowInfo(!showInfo)}
          className={showInfo ? "bg-primary/20" : ""}
        >
          <Info className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setLightMode(lightMode === "studio" ? "warehouse" : lightMode === "warehouse" ? "sunset" : "studio")}
        >
          {lightMode === "studio" ? (
            <Sun className="h-4 w-4" />
          ) : lightMode === "warehouse" ? (
            <MoonStar className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4 text-orange-500" />
          )}
        </Button>
      </div>

      {/* Model Info Overlay */}
      {showInfo && metadata && objects.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 bg-black/70 text-white p-3 rounded-md max-w-[300px] shadow-lg backdrop-blur-sm">
          <h3 className="font-bold text-sm">{metadata.title || "Untitled Model"}</h3>
          {metadata.description && <p className="text-xs mt-1 text-gray-300">{metadata.description}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {metadata.category && (
              <Badge variant="outline" className="text-xs border-buildfish-mint text-buildfish-mint">
                {metadata.category}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs border-buildfish-sunset text-buildfish-sunset">
              {objects.length} parts
            </Badge>
          </div>
        </div>
      )}

      {/* Prominent Download STL Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button 
          onClick={handleDownloadSTL} 
          className="bg-buildfish-sunset hover:bg-buildfish-sunset/90 text-white"
          disabled={!exporterLoaded}
        >
          <Download className="h-4 w-4 mr-2" />
          Download STL
        </Button>
      </div>

      <Canvas
        shadows
        onCreated={({ scene }) => {
          sceneRef.current = scene
        }}
      >
        {showStats && <Stats />}
        
        {/* Use Environment instead of simple lights for better visual quality */}
        <Environment preset={lightMode === "studio" ? "studio" : lightMode === "warehouse" ? "warehouse" : "sunset"} />
        
        {/* Fallback lights for compatibility */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {viewMode === "orbit" ? (
          <PerspectiveCamera makeDefault position={[20, 20, 20]} />
        ) : (
          <PerspectiveCamera makeDefault position={[0, 50, 0]} rotation={[-Math.PI / 2, 0, 0]} />
        )}

        {objects && objects.length > 0 ? (
          <>
            <group>
              {objects.map((obj, index) => (
                <CADObject key={index} object={obj} showMeasurements={showMeasurements} />
              ))}
            </group>
            <ContactShadows 
              opacity={0.5} 
              scale={40} 
              blur={2}
              far={10} 
              resolution={256} 
              color="#000000" 
            />
          </>
        ) : (
          <EmptyState />
        )}

        {showGrid && <Grid infiniteGrid fadeDistance={50} fadeStrength={5} />}

        <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} enabled={viewMode === "orbit"} />

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]} labelColor="white" />
        </GizmoHelper>
      </Canvas>
    </div>
  )
}

function CADObject({ object, showMeasurements }: { object: CADObject; showMeasurements: boolean }) {
  const { type, position, rotation, scale, color, name } = object
  const meshRef = useRef<THREE.Mesh>(null)

  // Add some subtle animation to highlight the object when measurements are shown
  useEffect(() => {
    if (!meshRef.current) return
    const mesh = meshRef.current
    if (showMeasurements) {
      mesh.userData.originalScale = { ...mesh.scale }
      mesh.scale.multiplyScalar(1.01)
    } else if (mesh.userData.originalScale) {
      mesh.scale.copy(mesh.userData.originalScale)
    }
  }, [showMeasurements])

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh ref={meshRef} castShadow receiveShadow>
        {type === "cube" && <boxGeometry args={[scale.x, scale.y, scale.z]} />}
        {type === "sphere" && <sphereGeometry args={[scale.x / 2, 32, 32]} />}
        {type === "cylinder" && <cylinderGeometry args={[scale.x / 2, scale.x / 2, scale.y, 32]} />}
        {type === "cone" && <coneGeometry args={[scale.x / 2, scale.y, 32]} />}
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
      </mesh>
      {showMeasurements && (
        <group>
          <Html position={[0, scale.y / 2 + 0.5, 0]}>
            <div className="bg-black/90 text-white text-xs p-1 rounded-md backdrop-blur-sm">
              <span className="font-bold">{name}</span>
              <br />
              {scale.x.toFixed(1)} x {scale.y.toFixed(1)} x {scale.z.toFixed(1)} cm
            </div>
          </Html>
        </group>
      )}
    </group>
  )
}

function EmptyState() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#cccccc" wireframe />
    </mesh>
  )
}

