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
    this.tagId = data.tag_id;
  }
}
