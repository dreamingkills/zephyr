import canvas from "canvas";
import { glob } from "glob";
import { promisify } from "util";

class FontService {
  async init(): Promise<number> {
    const globp = promisify(glob);
    const files = await globp(`./src/assets/fonts/*`);
    for (let file of files) {
      canvas.registerFont(file, { family: file.split("/")[4].slice(0, -4) });
    }
    return files.length;
  }
}

export const FontLoader = new FontService();
