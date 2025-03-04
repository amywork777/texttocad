"use client"

import { useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Grid, GizmoHelper, GizmoViewport, Html } from "@react-three/drei"
import { CADObject } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Eye, GridIcon, Layers, Ruler, Download } from "lucide-react"
import { STLExporter } from "three/examples/jsm/exporters/STLExporter"
import type * as THREE from "three"

interface CADRendererProps {
  objects: CADObject[]
}

export default function CADRenderer({ objects }: CADRendererProps) {
  const [showGrid, setShowGrid] = useState(true)
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [viewMode, setViewMode] = useState("orbit")
  const controlsRef = useRef(null)
  const sceneRef = useRef<THREE.Scene | null>(null)

  const handleDownloadSTL = () => {
    if (!sceneRef.current) return

    const exporter = new STLExporter()
    const stl = exporter.parse(sceneRef.current)

    const blob = new Blob([stl], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = "buildfish_model.stl"
    link.click()

    URL.revokeObjectURL(url)
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
      </div>

      {/* Prominent Download STL Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button onClick={handleDownloadSTL} className="bg-buildfish-sunset hover:bg-buildfish-sunset/90 text-white">
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
        {viewMode === "orbit" ? (
          <PerspectiveCamera makeDefault position={[20, 20, 20]} />
        ) : (
          <PerspectiveCamera makeDefault position={[0, 50, 0]} rotation={[-Math.PI / 2, 0, 0]} />
        )}

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {objects.map((obj, index) => (
          <CADObject key={index} object={obj} showMeasurements={showMeasurements} />
        ))}

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

  const meshRef = useRef(null)

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh ref={meshRef} castShadow receiveShadow>
        {type === "cube" && <boxGeometry args={[scale.x, scale.y, scale.z]} />}
        {type === "sphere" && <sphereGeometry args={[scale.x / 2, 32, 32]} />}
        {type === "cylinder" && <cylinderGeometry args={[scale.x / 2, scale.x / 2, scale.y, 32]} />}
        {type === "cone" && <coneGeometry args={[scale.x / 2, scale.y, 32]} />}
        <meshStandardMaterial color={color} />
      </mesh>
      {showMeasurements && (
        <group>
          <Html position={[0, scale.y / 2 + 0.5, 0]}>
            <div className="bg-black text-white text-xs p-1 rounded">
              {name}
              <br />
              {scale.x.toFixed(1)} x {scale.y.toFixed(1)} x {scale.z.toFixed(1)} cm
            </div>
          </Html>
        </group>
      )}
    </group>
  )
}

