import { loadImage } from "canvas";
import { GameFrame, IntermediateFrame } from "../../structures/game/Frame";
import { CosmeticGetter } from "../database/sql/game/shop/CosmeticGetter";
import fs from "fs/promises";

class FrameService {
  private frames: GameFrame[] = [];

  public async loadFrames(): Promise<GameFrame[]> {
    const frames = await CosmeticGetter.getFrames();

    const finalFrames = [];
    for (let frame of frames) {
      const intermediate: IntermediateFrame = {
        id: frame.id,
        name: frame.frame_name || `Unknown Frame`,
        frame: await loadImage(
          frame.frame_url || `./src/assets/frames/default/frame-default.png`
        ),
        mask: await fs.readFile(
          frame.dye_mask_url || `./src/assets/frames/default/mask-default.png`
        ),
        overlay: frame.overlay,
        textColor: frame.text_color_hex || `FFFFFF`,
      };

      finalFrames.push(new GameFrame(intermediate));
    }

    this.frames = finalFrames;
    return this.frames;
  }

  public getFrameById(id: number): GameFrame | undefined {
    return this.frames.find((frame) => frame.id === id);
  }

  public getFrameByName(name: string): GameFrame | undefined {
    return this.frames.find(
      (frame) => frame.name.toLowerCase() === name.toLowerCase()
    );
  }

  public async init(): Promise<void> {
    await this.loadFrames();
    return;
  }
}

export const Frames = new FrameService();
