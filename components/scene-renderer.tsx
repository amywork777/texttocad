"use client"

import { useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Grid } from "@react-three/drei"
import { SceneObject } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Eye, GridIcon, Layers } from "lucide-react"

interface SceneRendererProps {
  objects: SceneObject[]
}

export default function SceneRenderer({ objects }: SceneRendererProps) {
  const [showGrid, setShowGrid] = useState(true)
  const [viewMode, setViewMode] = useState("orbit")
  const controlsRef = useRef(null)

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
      </div>

      <Canvas shadows>
        {viewMode === "orbit" ? (
          <PerspectiveCamera makeDefault position={[10, 10, 10]} />
        ) : (
          <PerspectiveCamera makeDefault position={[0, 20, 0]} rotation={[-Math.PI / 2, 0, 0]} />
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
          <SceneObject key={index} object={obj} />
        ))}

        {showGrid && <Grid infiniteGrid fadeDistance={50} fadeStrength={5} />}

        <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} enabled={viewMode === "orbit"} />
      </Canvas>
    </div>
  )
}

function SceneObject({ object }: { object: SceneObject }) {
  const { type, position, rotation, scale, color } = object

  const props = {
    position: [position.x, position.y, position.z],
    rotation: rotation ? [rotation.x, rotation.y, rotation.z] : [0, 0, 0],
    scale: scale ? (typeof scale === "number" ? [scale, scale, scale] : [scale.x, scale.y, scale.z]) : [1, 1, 1],
    castShadow: true,
    receiveShadow: true,
  }

  return (
    <mesh {...props}>
      {type === "cube" && <boxGeometry args={[1, 1, 1]} />}
      {type === "sphere" && <sphereGeometry args={[0.5, 32, 32]} />}
      {type === "cylinder" && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
      <meshStandardMaterial color={color || "#ffffff"} />
    </mesh>
  )
}

