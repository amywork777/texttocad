export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface CADObject {
  // Geometry properties
  type: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  dimensions?: [number, number, number];
  radius?: number;
  height?: number;
  depth?: number;
  width?: number;
  color?: string;
  
  // Metadata
  name?: string;
  description?: string;
  material?: string;
  
  // Additional properties for complex objects
  children?: CADObject[];
  parameters?: Record<string, any>;
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

