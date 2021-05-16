import { Image } from "canvas";

export interface Frame {
  readonly id: number;
  readonly frame_name: string | null;
  readonly frame_url: string | null;
  readonly dye_mask_url: string | null;
  readonly overlay: 0 | 1;
  readonly text_color_hex: string | null;
}

export interface IntermediateFrame {
  readonly id: number;
  readonly name: string;
  readonly frame: Image;
  readonly frameUrl: string;
  readonly mask: Buffer;
  readonly maskUrl: string;
  readonly overlay: 0 | 1;
  readonly textColor: string;
}

export class GameFrame {
  readonly id: number;
  readonly name: string;
  readonly frame: Image;
  readonly frameUrl: string;
  readonly mask: Buffer;
  readonly maskUrl: string;
  readonly overlay: boolean;
  readonly textColor: string;

  constructor(data: IntermediateFrame) {
    this.id = data.id;
    this.name = data.name;
    this.frame = data.frame;
    this.frameUrl = data.frameUrl;
    this.mask = data.mask;
    this.maskUrl = data.maskUrl;
    this.overlay = data.overlay === 1 ? true : false;
    this.textColor = data.textColor;
  }
}
