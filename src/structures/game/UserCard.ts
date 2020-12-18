export interface UserCard {
  id: number;
  card_id: number;
  serial_number: number;
  discord_id: string;
  original_owner: string;
  wear: 0 | 1 | 2 | 3 | 4 | 5;
  luck_coeff: number;
  frame_id: number;
  frame_name: string;
  frame_url: string;
  dye_mask_url: string;
  dye_r: number;
  dye_g: number;
  dye_b: number;
  claim_time: number;
  tag_id: number;
}
export class GameUserCard {
  id: number;
  baseCardId: number;
  serialNumber: number;
  discordId: string;
  originalOwner: string;
  wear: 0 | 1 | 2 | 3 | 4 | 5;
  luckCoefficient: number;
  frameId: number;
  frameName: string;
  frameUrl: string;
  dyeMaskUrl: string;
  dyeR: number;
  dyeG: number;
  dyeB: number;
  claimTime: number;

  tagId: number;

  constructor(data: UserCard) {
    this.id = data.id;
    this.baseCardId = data.card_id;
    this.serialNumber = data.serial_number;
    this.discordId = data.discord_id;
    this.originalOwner = data.original_owner;
    this.wear = data.wear;
    this.luckCoefficient = data.luck_coeff;
    this.frameId = data.frame_id;
    this.frameName = data.frame_name;
    this.frameUrl = data.frame_url;
    this.dyeMaskUrl = data.dye_mask_url;
    this.claimTime = data.claim_time;

    this.tagId = data.tag_id;

    this.dyeR = data.dye_r;
    this.dyeG = data.dye_g;
    this.dyeB = data.dye_b;
  }
}
