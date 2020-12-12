export interface Wishlist {
  id: number;
  discord_id: string;
  name: string;
  group_name: string;
}

export class GameWishlist {
  id: number;
  discordId: string;
  name: string;
  groupName: string;
  constructor(data: Wishlist) {
    this.id = data.id;
    this.discordId = data.discord_id;
    this.name = data.name;
    this.groupName = data.group_name;
  }
}
