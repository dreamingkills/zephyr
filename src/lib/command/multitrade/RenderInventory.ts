import { GameDye } from "../../../structures/game/Dye";
import { GameUserCard } from "../../../structures/game/UserCard";

export function renderMultitradeInventory(
  tradeItems: TradeItemResolvable[],
  confirmed: boolean,
  accepted: boolean
): string {
  const cards = tradeItems.filter(
    (i) => i instanceof GameUserCard
  ) as GameUserCard[];

  const dyes = tradeItems.filter((i) => i instanceof GameDye) as GameDye[];

  const bits = (<InteractableBits>tradeItems.filter((i) => isBitItem(i))[0])
    ?.bits;

  const cubits = (<InteractableCubits>(
    tradeItems.filter((i) => isCubitItem(i))[0]
  ))?.cubits;

  const baseItems = tradeItems.filter((i) =>
    isInteractableItem(i)
  ) as InteractableItem[];

  const trueBaseItems: InteractableItem[] = [];

  for (let item of baseItems) {
    const findItem = trueBaseItems.find((i) => i.item.id === item.item.id);
    if (findItem) {
      findItem.count += item.count;
    } else {
      trueBaseItems.push({ ...item });
    }
  }

  let status = accepted
    ? `+ Accepted +`
    : confirmed
    ? `+ Confirmed +`
    : `- Unconfirmed -`;

  return `\`\`\`diff\n${status}\n\n${
    bits ? `${bits.toLocaleString()} bits\n` : ``
  }${cubits ? `${cubits.toLocaleString()} cubits\n` : ``}${
    cards.length > 0
      ? cards.map((c) => c.id.toString(36)).join(`, `) + `\n`
      : ``
  }${
    dyes.length > 0
      ? dyes.map((d) => `$${d.id.toString(36)}`).join(`, `) + `\n`
      : ``
  }${
    trueBaseItems.length > 0
      ? trueBaseItems.map((i) => `${i.count}x ${i.item.names[0]}`).join(`, `)
      : ``
  }\n\`\`\``;
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
