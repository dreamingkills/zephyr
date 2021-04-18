import { GameShop } from "../shop/Shop";
import { GameStickerPack } from "../shop/StickerPack";
import { ZephyrError } from "./ZephyrError";

export class InvalidItemNameError extends ZephyrError {
  constructor(prefix: string) {
    super(
      `**Please enter a valid item to purchase!**\nYou can view available items by using \`${prefix}itemshop\`.`
    );
  }
}

export class ItemNotFoundError extends ZephyrError {
  constructor() {
    super(
      `**I couldn't find an item with that name!**\nPlease make sure your spelling is correct.`
    );
  }
}

export class NotEnoughBitsForItemError extends ZephyrError {
  constructor(item: GameShop) {
    super(
      `**You don't have enough bits to buy that!**\nThe \`${
        item.item.names[0]
      }\` costs **${item.price.toLocaleString()}** bits.`
    );
  }
}

export class NotEnoughCubitsForItemError extends ZephyrError {
  constructor(item: GameShop) {
    super(
      `**You don't have enough cubits to buy that!**\nThe \`${
        item.item.names[0]
      }\` costs **${item.price.toLocaleString()}** cubits.`
    );
  }
}

export class InvalidPackNameError extends ZephyrError {
  constructor(prefix: string) {
    super(
      `**Please enter a valid sticker pack name!**\nYou can view available packs by using \`${prefix}stickershop\`.`
    );
  }
}

export class PackNotFoundError extends ZephyrError {
  constructor() {
    super(
      `**I couldn't find a sticker pack with that name!**\nPlease make sure your spelling is correct.`
    );
  }
}

export class InvalidCurrencyError extends ZephyrError {
  constructor() {
    super(
      `**That sticker pack is not marked with a valid currency!**\nPlease report this to the developer at [https://discord.gg/zephyr].`
    );
  }
}

export class NotEnoughBitsForPackError extends ZephyrError {
  constructor(pack: GameStickerPack) {
    super(
      `**You don't have enough bits to buy that!**\nThe \`${
        pack.name
      }\` costs **${pack.price.toLocaleString()}** bits.`
    );
  }
}

export class NotEnoughCubitsForPackError extends ZephyrError {
  constructor(pack: GameStickerPack) {
    super(
      `**You don't have enough cubits to buy that!**\nThe \`${
        pack.name
      }\` costs **${pack.price.toLocaleString()}** cubits.`
    );
  }
}

export class ItemNotBoundError extends ZephyrError {
  constructor() {
    super(
      `**That pack does not have a bound item!**\nPlease report this to the developer at [https://discord.gg/zephyr].`
    );
  }
}

export class PackNotForSaleError extends ZephyrError {
  constructor(prefix: string) {
    super(
      `**That sticker pack is not for sale!**\nUse \`${prefix}stickershop\` to view all available sticker packs!`
    );
  }
}

export * as ShopError from "./ShopError";
