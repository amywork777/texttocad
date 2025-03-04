export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface CADObject {
  type: "cube" | "sphere" | "cylinder" | "cone"
  position: Vector3
  rotation: Vector3
  scale: Vector3
  color: string
  name: string
}

export interface GeneratedCAD {
  objects: CADObject[]
  rawResponse: string
}

export interface SceneObject {
  type: "cube" | "sphere" | "cylinder" | "cone"
  position: Vector3
  rotation?: Vector3
  scale?: number | Vector3
  color?: string
}

