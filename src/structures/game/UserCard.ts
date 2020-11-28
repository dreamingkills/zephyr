export interface UserCard {
  id: number;
  card_id: number;
  serial_number: number;
  discord_id: string;
  original_owner: string;
  tier: number;
  frame_id?: number;
  frame_name?: string;
  frame_url?: string;

  identifier: string;
}
export class GameUserCard {
  id: number;
  baseCardId: number;
  serialNumber: number;
  discordId: string;
  originalOwner: string;
  tier: number;
  frameId?: number;
  frameName?: string;
  frameUrl?: string;

  identifier: string;
  constructor(data: UserCard) {
    this.id = data.id;
    this.baseCardId = data.card_id;
    this.serialNumber = data.serial_number;
    this.discordId = data.discord_id;
    this.originalOwner = data.original_owner;
    this.tier = data.tier;
    this.frameId = data.frame_id;
    this.frameName = data.frame_name;
    this.frameUrl = data.frame_url;

    this.identifier = data.identifier;
  }
}
