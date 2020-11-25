import canvas from "canvas";
import { glob } from "glob";
import { promisify } from "util";
export class FontLoader {
  static async init() {
    const globp = promisify(glob);
    const files = await globp(`./src/assets/fonts/*`);
    for (let file of files) {
      console.log(files, file);
      canvas.registerFont(file, { family: file.split("/")[4].slice(0, -4) });
    }
    return;
  }
}
