export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface CADObject {
  // Geometry properties
  type: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  color: string;
  
  // Metadata
  name: string;
  description?: string;
  material?: string;
  
  // Additional properties for complex objects
  children?: CADObject[];
  parameters?: Record<string, any>;
}

export interface GeneratedCAD {
  objects: CADObject[]
  rawResponse: string
  metadata?: {
    title: string
    description: string
    category: string
    createdAt?: string
  }
}

export interface SceneObject {
  type: "cube" | "sphere" | "cylinder" | "cone"
  position: Vector3
  rotation?: Vector3
  scale?: Vector3
  color?: string
}

