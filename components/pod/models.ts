import type { WorldId } from './worlds';

/**
 * Hero props loaded from .glb files (TRELLIS.2, Hunyuan3D, Blender exports) and drawn by the same
 * shader as the hand-built room, so they share its lights, shadow map, SSAO and depth of field.
 *
 * The loader normalises each model to the box convention: centred on its bounds, largest side 1.
 * So `size` is the model's largest dimension in room units, and (x, y, z) is the centre of its bounds.
 * To rest a model on a surface at height h, set `rest: h` instead of y and it sits on it exactly.
 *
 * Put the files in public/models/. Budget: about 15k triangles and 1024px textures for a prop near the
 * camera, about 5k and 512px for shelf clutter. Draco or meshopt files must be decompressed first.
 */
export type ModelProp = {
  url: string;
  size: number;
  x: number;
  y?: number;
  /** The surface height the model's base rests on; overrides y. */
  rest?: number;
  z: number;
  rx?: number;
  ry?: number;
  rz?: number;
  /** Override every part's metallic / roughness factors (AI exports often ship no metallic map). */
  metal?: number;
  rough?: number;
  /** Hovering lifts it and clicking flies the camera to it, like the other section objects. */
  anchor?: WorldId;
};

export const MODELS: ModelProp[] = [];
