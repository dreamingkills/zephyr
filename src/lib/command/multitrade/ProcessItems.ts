import { CardService } from "../../database/services/game/CardService";
import { ProfileService } from "../../database/services/game/ProfileService";
import { ItemService } from "../../ItemService";
import { strToInt } from "../../utility/text/TextUtils";

export async function processItems(
  stringItems: string[]
): Promise<TradeItemResolvable[]> {
  const tradeItems: TradeItemResolvable[] = [];
  let bits, cubits;
  for (let item of stringItems) {
    const split = item.split(" ").map((t) => t.toLowerCase());
    if (split.length === 1) {
      if (item.startsWith("$")) {
        try {
          const getDye = await ProfileService.getDyeByIdentifier(item);
          tradeItems.push(getDye);
          continue;
        } catch {}
      }
      try {
        const getCard = await CardService.getUserCardByIdentifier(item);
        tradeItems.push(getCard);
        continue;
      } catch {}
    }

    if (split.length === 2) {
      if (split[1] === "bits") {
        const amount = strToInt(split[0]);

        if (!isNaN(amount) && amount > 0) {
          bits = (bits || 0) + amount;
        }
        continue;
      }

      if (split[1] === "cubits") {
        const amount = strToInt(split[0]);

        if (!isNaN(amount) && amount > 0) {
          cubits = (cubits || 0) + amount;
        }
        continue;
      }
    }

    // Single Item Detection
    let amount = 1;
    let baseItem = ItemService.getItemByName(item);
    if (!baseItem) {
      const noNumber = item.split(" ").slice(1).join(" ").toLowerCase();
      const derivedAmount = parseInt(item.split(" ")[0]);
      if (isNaN(derivedAmount) || derivedAmount < 0) continue;

      amount = derivedAmount;

      baseItem = ItemService.getItemByName(noNumber);
    }

    if (!baseItem) continue;
    tradeItems.push({ item: baseItem, count: amount });
  }

  if (bits) tradeItems.push({ bits });
  if (cubits) tradeItems.push({ cubits });

  return tradeItems;
}
