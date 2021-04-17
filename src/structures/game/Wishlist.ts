export interface Wishlist {
  readonly id: number;
  readonly discord_id: string;
  readonly idol_id: number;
}

export class GameWishlist {
  readonly id: number;
  readonly discordId: string;
  readonly idolId: number;
  constructor(data: Wishlist) {
    this.id = data.id;
    this.discordId = data.discord_id;
    this.idolId = data.idol_id;
  }
}
