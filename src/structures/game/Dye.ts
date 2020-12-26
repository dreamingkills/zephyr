import { ProfileService } from "../../lib/database/services/game/ProfileService";

export interface Dye {
  id: number;
  discord_id: string;
  name: string;
  dye_r: number;
  dye_g: number;
  dye_b: number;
  charges: number;
}

export class GameDye {
  id: number;
  discordId: string;
  name: string;
  dyeR: number;
  dyeG: number;
  dyeB: number;
  charges: number;
  constructor(data: Dye) {
    this.id = data.id;
    this.discordId = data.discord_id;
    this.name = data.name;
    this.dyeR = data.dye_r;
    this.dyeG = data.dye_g;
    this.dyeB = data.dye_b;
    this.charges = data.charges;
  }

  public async fetch(): Promise<GameDye> {
    return await ProfileService.getDyeById(this.id);
  }
}
