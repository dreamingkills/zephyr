import { Zephyr } from "../../../structures/client/Zephyr";
import { GameDye } from "../../../structures/game/Dye";
import { Recipe } from "../../../structures/game/Recipe";
import { GameTag } from "../../../structures/game/Tag";
import { GameUserCard } from "../../../structures/game/UserCard";
import { items } from "../../../assets/items.json";

export function strToInt(text: string): number {
  let result = parseInt(text.replace(/[, ]+/g, ""), 10);
  if (text.toLowerCase().endsWith("k")) result *= 1000;
  if (text.toLowerCase().endsWith("m")) result *= 1000000;
  if (text.toLowerCase().endsWith("b")) result *= 1000000000;
  return result;
}

export function padIfNotLeading(
  text: string | number,
  leading: boolean
): string {
  return leading ? text.toString() : text.toString().padStart(2, "0");
}

export function escapeMarkdown(value: string): string {
  const unescaped = value.replace(/\\(\*|_|`|~|\\)/g, "$1"); // un-escape backslashed characters
  return unescaped.replace(/(\*|_|`|~|\\)/g, "\\$1"); // escape *, _, `, ~, \
}

export function renderRecipe(recipe: Recipe): string {
  return `\`\`\`diff\n${recipe.ingredients
    .map((i) => {
      const baseItem = items.filter((b) => b.id === i.itemId)[0];
      return `- ${i.count}x ${baseItem?.name || "Unknown Item"}`;
    })
    .join("\n")}\`\`\`\`\`\`diff\n${recipe.result
    .map((i) => {
      const baseItem = items.filter((b) => b.id === i.itemId)[0];
      return `+ ${i.count}x ${baseItem?.name || "Unknown Item"}`;
    })
    .join("\n")}\n\`\`\``;
}

export function getDescriptions(
  targets: (GameUserCard | GameDye)[],
  zephyr: Zephyr,
  tags: GameTag[] = []
): string[] {
  const descriptions = [];
  const onlyCards = targets.filter(
    (t) => t instanceof GameUserCard
  ) as GameUserCard[];
  const onlyDyes = targets.filter((t) => t instanceof GameDye) as GameDye[];

  const longestCardIdentifier =
    [...onlyCards]
      .sort((a, b) =>
        a.id.toString(36).length < b.id.toString(36).length ? 1 : -1
      )[0]
      ?.id.toString(36).length || 1;
  const longestDyeIdentifier =
    [...onlyDyes]
      .sort((a, b) =>
        `$${a.id.toString(36)}`.length < `$${b.id.toString(36)}`.length ? 1 : -1
      )[0]
      ?.id.toString(36).length + 1 || 1;

  const padLeft = Math.max(longestCardIdentifier, longestDyeIdentifier);

  const longestIssue =
    [...onlyCards]
      .sort((a, b) =>
        a.serialNumber.toString().length < b.serialNumber.toString().length
          ? 1
          : -1
      )[0]
      ?.serialNumber.toString().length + 1 || 1;
  const longestCharge =
    [...onlyDyes]
      .sort((a, b) =>
        a?.charges.toString().length < b?.charges.toString().length ? 1 : -1
      )[0]
      ?.charges.toString().length || 1;

  const padRight = Math.max(longestIssue, longestCharge);

  for (let t of targets) {
    if (t instanceof GameUserCard) {
      const baseCard = zephyr.getCard(t.baseCardId);
      const hasTag = tags.filter(
        (tag) => tag.id === (<GameUserCard>t).tagId
      )[0];

      descriptions.push(
        `${hasTag?.emoji || `:white_medium_small_square:`} \`${t.id
          .toString(36)
          .padStart(padLeft, " ")}\` : \`${"★"
          .repeat(t.wear)
          .padEnd(5, "☆")}\` : \`${(`#` + t.serialNumber.toString(10)).padEnd(
          padRight,
          " "
        )}\`` +
          ` ${baseCard.group ? `**${baseCard.group}** ` : ``}${baseCard.name}` +
          (baseCard.emoji ? ` ${baseCard.emoji}` : ``)
      );
    } else if (t instanceof GameDye) {
      descriptions.push(
        `:white_medium_small_square: \`${`$${t.id.toString(36)}`.padStart(
          padRight,
          " "
        )}\` : \`☆☆☆☆☆\` : \`${t.charges
          .toString()
          .padEnd(padRight, " ")}\` **${t.name}** Dye`
      );
    }
  }

  return descriptions;
}
