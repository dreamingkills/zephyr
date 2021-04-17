import { Image } from "canvas";

export interface Frame {
  readonly id: number;
  readonly frame_name: string | null;
  readonly frame_url: string | null;
  readonly dye_mask_url: string | null;
  readonly overlay: boolean;
  readonly text_color_hex: string | null;
}

export interface IntermediateFrame {
  readonly id: number;
  readonly name: string;
  readonly frame: Image;
  readonly mask: Buffer;
  readonly overlay: boolean;
  readonly textColor: string;
}

export class GameFrame {
  readonly id: number;
  readonly name: string;
  readonly frame: Image;
  readonly mask: Buffer;
  readonly overlay: boolean;
  readonly textColor: string;

  constructor(data: IntermediateFrame) {
    this.id = data.id;
    this.name = data.name;
    this.frame = data.frame;
    this.mask = data.mask;
    this.overlay = data.overlay;
    this.textColor = data.textColor;
  }
}
