import { GameDye } from "../../../structures/game/Dye";
import { GameProfile } from "../../../structures/game/Profile";
import { GameUserCard } from "../../../structures/game/UserCard";
import { DB } from "../../database";
import {
  isBitItem,
  isCubitItem,
  isInteractableItem,
} from "./typeguards/MultitradeTypeguards";

export function processMultitradeLogs(
  items: TradeItemResolvable[],
  giver: GameProfile,
  receiver: GameProfile,
  uuid: string,
  timestamp: string
): string[] {
  const queries = [];

  for (let item of items) {
    let itemType, itemValue, quantity;

    if (item instanceof GameUserCard) {
      itemType = "card";
      itemValue = item.id;
      quantity = 1;
    } else if (item instanceof GameDye) {
      itemType = "dye";
      itemValue = item.id;
      quantity = 1;
    } else if (isBitItem(item)) {
      itemType = "bits";
      itemValue = "";
      quantity = item.bits;
    } else if (isCubitItem(item)) {
      itemType = "cubits";
      itemValue = "";
      quantity = item.cubits;
    } else if (isInteractableItem(item)) {
      itemType = "item";
      itemValue = item.item.id;
      quantity = item.count;
    } else {
      itemType = "unknown";
      itemValue = "";
      quantity = 0;
    }

    queries.push(
      `(${DB.connection.escape(uuid)}, ${DB.connection.escape(
        giver.discordId
      )}, ${DB.connection.escape(receiver.discordId)}, ${DB.connection.escape(
        itemType
      )}, ${DB.connection.escape(itemValue)}, ${DB.connection.escape(
        quantity
      )}, ${DB.connection.escape(timestamp)})`
    );
  }

  return queries;
}
