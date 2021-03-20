import { CardService } from "../../lib/database/services/game/CardService";

export interface UserCard {
  id: number;
  card_id: number;
  serial_number: number;
  discord_id: string;
  original_owner: string;
  wear: 0 | 1 | 2 | 3 | 4 | 5;
  frame_id: number;
  frame_name: string;
  frame_url: string;
  text_color_hex: Buffer;
  dye_mask_url: string;
  dye_r: number | null;
  dye_g: number | null;
  dye_b: number | null;
  claim_time: number;
  tag_id: number | null;
  original_wear: number;
  fight_count: number;
  luck_coeff: number;
  dropper: string;
}

export class GameUserCard {
  id: number;
  baseCardId: number;
  serialNumber: number;
  discordId: string;
  originalOwner: string;
  wear: 0 | 1 | 2 | 3 | 4 | 5;
  frameId: number;
  frameName: string;
  frameUrl: string;
  textColor: string;
  dyeMaskUrl: string;
  dyeR: number;
  dyeG: number;
  dyeB: number;
  claimTime: number;
  originalWear: number;
  fightCount: number;
  luckCoefficient: number;
  dropper: string;

  tagId: number | undefined;

  constructor(data: UserCard) {
    this.id = data.id;
    this.baseCardId = data.card_id;
    this.serialNumber = data.serial_number;
    this.discordId = data.discord_id;
    this.originalOwner = data.original_owner;
    this.wear = data.wear;
    this.frameId = data.frame_id;
    this.frameName = data.frame_name;
    this.frameUrl = data.frame_url;
    this.textColor = data.text_color_hex?.toString() || `000000`;
    this.dyeMaskUrl = data.dye_mask_url;
    this.claimTime = data.claim_time;
    this.originalWear = data.original_wear;
    this.fightCount = data.fight_count;
    this.luckCoefficient = data.luck_coeff;
    this.dropper = data.dropper;

    this.tagId = data.tag_id || undefined;

    if (data.dye_r || data.dye_r === 0) {
      this.dyeR = data.dye_r;
    } else this.dyeR = -1;
    if (data.dye_g || data.dye_g === 0) {
      this.dyeG = data.dye_g;
    } else this.dyeG = -1;
    if (data.dye_b || data.dye_b === 0) {
      this.dyeB = data.dye_b;
    } else this.dyeB = -1;
  }

  public async fetch(): Promise<GameUserCard> {
    return await CardService.getUserCardById(this.id);
  }
}
