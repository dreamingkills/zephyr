import { getNearestColor, rgbToHex } from "../../lib/ZephyrUtils";

export interface Dye {
  id: number;
  discord_id: string;
  dye_r: number;
  dye_g: number;
  dye_b: number;
  charges: number;
}

export class GameDye {
  id: number;
  discordId: string;
  dyeR: number;
  dyeG: number;
  dyeB: number;
  charges: number;
  name: string;
  constructor(data: Dye) {
    this.id = data.id;
    this.discordId = data.discord_id;
    this.dyeR = data.dye_r;
    this.dyeG = data.dye_g;
    this.dyeB = data.dye_b;
    this.charges = data.charges;

    this.name = getNearestColor(
      rgbToHex(data.dye_r, data.dye_g, data.dye_b)
    ).name;
  }
}
