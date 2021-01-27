export interface Wishlist {
  id: number;
  discord_id: string;
  idol_id: number;
}

export class GameWishlist {
  id: number;
  discordId: string;
  idolId: number;
  constructor(data: Wishlist) {
    this.id = data.id;
    this.discordId = data.discord_id;
    this.idolId = data.idol_id;
  }
}
