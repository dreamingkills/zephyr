export interface UserCard {
  id: number;
  card_id: number;
  serial_number: number;
  discord_id: string;
  original_owner: string;
  tier: number;
  frame: string;
}
export class GameUserCard {
  id: number;
  baseCardId: number;
  serialNumber: number;
  discordId: string;
  originalOwner: string;
  tier: number;
  frame: string;
  constructor(data: UserCard) {
    this.id = data.id;
    this.baseCardId = data.card_id;
    this.serialNumber = data.serial_number;
    this.discordId = data.discord_id;
    this.originalOwner = data.original_owner;
    this.tier = data.tier;
    this.frame = data.frame;
  }
}
