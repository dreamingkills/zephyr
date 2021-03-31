import { GameIdol } from "../game/Idol";
import { ZephyrError } from "./ZephyrError";

export class WishlistFullError extends ZephyrError {
  constructor(prefix: string) {
    super(
      `**You have no more room on your wishlist!**\nRemove some idols or \`${prefix}donate\` to get more slots!`
    );
  }
}

export class WishlistEmptyError extends ZephyrError {
  constructor(prefix: string) {
    super(
      `**Your wishlist is empty!**\nYou can add idols by using \`${prefix}wa <idol name>\`.`
    );
  }
}

export class WishlistDuplicateError extends ZephyrError {
  constructor(idol: GameIdol, prefix: string) {
    super(
      `**${
        idol.name
      } is already on your wishlist!**\nYou can remove them by using \`${prefix}wr ${idol.name.toLowerCase()}\`!`
    );
  }
}

export class IdolNotOnWishlistError extends ZephyrError {
  constructor() {
    super(
      `**No idols on your wishlist match that name!**\nMake sure you spelled everything correctly!`
    );
  }
}

export * as WishlistError from "./WishlistError";
