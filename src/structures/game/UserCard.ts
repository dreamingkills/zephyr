export interface UserCard {
  id: number;
  card_id: number;
  serial_number: number;
  discord_id: string;
  tier: number;
}
export class GameUserCard {
  id: number;
  baseCardId: number;
  serialNumber: number;
  discordId: string;
  tier: number;
  constructor(data: UserCard) {
    this.id = data.id;
    this.baseCardId = data.card_id;
    this.serialNumber = data.serial_number;
    this.discordId = data.discord_id;
    this.tier = data.tier;
  }
}
