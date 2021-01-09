import { GameProfile } from "../../../structures/game/Profile";
import { GameUserCard } from "../../../structures/game/UserCard";
import { ProfileService } from "../../database/services/game/ProfileService";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { Message, TextableChannel } from "eris";

export async function verifyMultitradeItems(
  msg: Message,
  handleError: (msg: Message<TextableChannel>, error: Error) => Promise<void>,
  items: TradeItemResolvable[],
  profile: GameProfile,
  existingItems: TradeItemResolvable[]
) {
  for (let item of items) {
    if (item instanceof GameUserCard) {
      if (item.discordId !== profile.discordId) continue;

      const cardInTrade = existingItems.filter(
        (t) => t instanceof GameUserCard && t.id === (<GameUserCard>item).id
      )[0] as GameUserCard | undefined;

      if (cardInTrade) continue;
      existingItems.push(item);
      continue;
    } else if (isBitItem(item)) {
      if (item.bits > profile.bits) {
        await handleError(
          msg,
          new ZephyrError.NotEnoughBitsError(profile.bits, item.bits)
        );
        continue;
      }

      const bitsInTrade = existingItems.filter((i) => isBitItem(i))[0] as
        | InteractableBits
        | undefined;

      if ((bitsInTrade?.bits || 0) + item.bits > profile.bits) {
        await handleError(
          msg,
          new ZephyrError.NotEnoughBitsError(profile.bits, item.bits)
        );
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
      if (item.cubits > profile.cubits) {
        await handleError(
          msg,
          new ZephyrError.NotEnoughCubitsError(profile.cubits, item.cubits)
        );
        continue;
      }

      const cubitsInTrade = existingItems.filter((i) => isCubitItem(i))[0] as
        | InteractableCubits
        | undefined;

      if ((cubitsInTrade?.cubits || 0) + item.cubits > profile.cubits) {
        await handleError(
          msg,
          new ZephyrError.NotEnoughCubitsError(profile.cubits, item.cubits)
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
        const userItem = await ProfileService.getItem(
          profile,
          item.item.id,
          item.item.name
        );

        if ((itemInTrade?.count || 0) + item.count > userItem.quantity) {
          await handleError(
            msg,
            new ZephyrError.NotEnoughOfItemError(item.item.name)
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
          new ZephyrError.NoItemInInventoryError(item.item.name)
        );
        continue;
      }
    }
  }
}

function isInteractableItem(value: any): value is InteractableItem {
  return value.hasOwnProperty("item") && value.hasOwnProperty("count");
}

function isBitItem(value: any): value is InteractableBits {
  return value.hasOwnProperty("bits");
}

function isCubitItem(value: any): value is InteractableCubits {
  return value.hasOwnProperty("cubits");
}
