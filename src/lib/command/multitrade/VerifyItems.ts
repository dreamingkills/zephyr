import { GameProfile } from "../../../structures/game/Profile";
import { GameUserCard } from "../../../structures/game/UserCard";
import { ProfileService } from "../../database/services/game/ProfileService";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { Message, TextableChannel } from "eris";
import { GameDye } from "../../../structures/game/Dye";
import {
  isBitItem,
  isCubitItem,
  isInteractableItem,
} from "./typeguards/MultitradeTypeguards";
import { AlbumService } from "../../database/services/game/AlbumService";

export async function verifyMultitradeItems(
  msg: Message,
  handleError: (msg: Message<TextableChannel>, error: Error) => Promise<void>,
  items: TradeItemResolvable[],
  profile: GameProfile,
  existingItems: TradeItemResolvable[] = []
) {
  const newProfile = await profile.fetch();
  for (let item of items) {
    if (item instanceof GameUserCard) {
      const card = await item.fetch();
      if (card.discordId !== profile.discordId) continue;

      const cardInTrade = existingItems.filter(
        (t) => t instanceof GameUserCard && t.id === card.id
      )[0] as GameUserCard | undefined;

      if (cardInTrade) continue;

      const isInAlbum = await AlbumService.cardIsInAlbum(card);
      if (isInAlbum) {
        await handleError(msg, new ZephyrError.CardInAlbumError(card));
        continue;
      }

      existingItems.push(card);
      continue;
    } else if (item instanceof GameDye) {
      const dye = await item.fetch();
      if (dye.discordId !== profile.discordId) continue;

      const dyeInTrade = existingItems.filter(
        (t) => t instanceof GameDye && t.id === dye.id
      )[0] as GameDye | undefined;

      if (dyeInTrade) continue;
      existingItems.push(dye);
      continue;
    } else if (isBitItem(item)) {
      if (item.bits > newProfile.bits) {
        await handleError(msg, new ZephyrError.NotEnoughBitsError(item.bits));
        continue;
      }

      const bitsInTrade = existingItems.filter((i) => isBitItem(i))[0] as
        | InteractableBits
        | undefined;

      if ((bitsInTrade?.bits || 0) + item.bits > newProfile.bits) {
        await handleError(msg, new ZephyrError.NotEnoughBitsError(item.bits));
        continue;
      }

      if (!bitsInTrade) {
        existingItems.push({
          bits: item.bits,
        });
      } else {
        bitsInTrade.bits += item.bits;
      }
      continue;
    } else if (isCubitItem(item)) {
      if (item.cubits > newProfile.cubits) {
        await handleError(
          msg,
          new ZephyrError.NotEnoughCubitsError(newProfile.cubits, item.cubits)
        );
        continue;
      }

      const cubitsInTrade = existingItems.filter((i) => isCubitItem(i))[0] as
        | InteractableCubits
        | undefined;

      if ((cubitsInTrade?.cubits || 0) + item.cubits > newProfile.cubits) {
        await handleError(
          msg,
          new ZephyrError.NotEnoughCubitsError(newProfile.cubits, item.cubits)
        );
        continue;
      }

      if (!cubitsInTrade) {
        existingItems.push({
          cubits: item.cubits,
        });
      } else {
        cubitsInTrade.cubits += item.cubits;
      }
      continue;
    } else if (isInteractableItem(item)) {
      const itemInTrade = existingItems.filter(
        (i) =>
          isInteractableItem(i) &&
          i.item.id === (<InteractableItem>item).item.id
      )[0] as InteractableItem | undefined;

      try {
        if (item.item.soulbound)
          throw new ZephyrError.ItemSoulboundError(item.item);

        const userItem = await ProfileService.getItem(
          newProfile,
          item.item.id,
          item.item.names[0]
        );

        if ((itemInTrade?.count || 0) + item.count > userItem.quantity) {
          await handleError(
            msg,
            new ZephyrError.NotEnoughOfItemError(item.item.names[0])
          );
          continue;
        }

        if (!itemInTrade) {
          existingItems.push(item);
        } else {
          itemInTrade.count += item.count;
        }
        continue;
      } catch {
        await handleError(
          msg,
          new ZephyrError.NoItemInInventoryError(item.item.names[0])
        );
        continue;
      }
    }
  }
}
