import { ProfileService } from "../../lib/database/services/game/ProfileService";

export interface Dye {
  readonly id: number;
  readonly discord_id: string;
  readonly name: string;
  readonly dye_r: number;
  readonly dye_g: number;
  readonly dye_b: number;
  readonly charges: number;
}

export class GameDye {
  readonly id: number;
  readonly discordId: string;
  readonly name: string;
  readonly dyeR: number;
  readonly dyeG: number;
  readonly dyeB: number;
  readonly charges: number;
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
