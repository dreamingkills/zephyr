import { User } from "eris";
import { getItemById } from "../../../assets/Items";
import { Zephyr } from "../../../structures/client/Zephyr";
import { GameAlbumCard } from "../../../structures/game/Album";
import { GameBaseCard } from "../../../structures/game/BaseCard";
import { GameDye } from "../../../structures/game/Dye";
import { GameProfile } from "../../../structures/game/Profile";
import { Recipe } from "../../../structures/game/Recipe";
import { GameTag } from "../../../structures/game/Tag";
import { GameUserCard } from "../../../structures/game/UserCard";

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
      const baseItem = getItemById(i.itemId);
      return `- ${i.count}x ${baseItem?.names[0] || "Unknown Item"}`;
    })
    .join("\n")}\`\`\`\`\`\`diff\n${recipe.result
    .map((i) => {
      const baseItem = getItemById(i.itemId);
      return `+ ${i.count}x ${baseItem?.names[0] || "Unknown Item"}`;
    })
    .join("\n")}\n\`\`\``;
}

export async function getDescriptions(
  targets: (GameUserCard | GameDye)[],
  tags: GameTag[] = [],
  showSubgroup: boolean = false,
  albumCards: GameAlbumCard[] = []
): Promise<string[]> {
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
      const baseCard = Zephyr.getCard(t.baseCardId)!;
      const hasTag = tags.filter(
        (tag) => tag.id === (<GameUserCard>t).tagId
      )[0];

      descriptions.push(
        `${hasTag?.emoji || `:white_medium_small_square:`} \`${renderIdentifier(
          t
        ).padStart(padLeft, " ")}\` : \`${"★"
          .repeat(t.wear)
          .padEnd(5, "☆")}\` : \`${(`#` + t.serialNumber.toString(10)).padEnd(
          padRight,
          " "
        )}\`` +
          ` **${baseCard.group || `Soloist`}** ${baseCard.name}` +
          (baseCard.emoji ? ` ${baseCard.emoji}` : ``) +
          (showSubgroup && baseCard.subgroup
            ? ` **(${baseCard.subgroup})**`
            : ``) +
          (albumCards.find((c) => c.cardId === t.id) ? ` 🔖` : ``)
      );
    } else if (t instanceof GameDye) {
      descriptions.push(
        `:white_medium_small_square: \`${`$${renderIdentifier(t)}`.padStart(
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

export function renderIdentifier(card: GameUserCard | GameDye): string {
  return card.id.toString(36).replace(/l/g, `L`);
}

export function getGroupsByIdolId(
  idolId: number,
  cards: GameBaseCard[]
): string[] {
  const groups: string[] = [];

  cards
    .filter((c) => c.idolId === idolId)
    .forEach((c) => {
      if (!groups.includes(c.group || `Soloist`))
        groups.push(c.group || `Soloist`);
    });

  return groups;
}

export function generateUserTag(
  sender: User,
  user: User | undefined,
  profile: GameProfile
): string {
  if (!user) return `Unknown User`;

  const isMod = Zephyr.config.moderators.includes(sender.id);
  const isDev = Zephyr.config.developers.includes(sender.id);

  if (isMod || isDev || user.id === sender.id) return user.tag;

  if (profile.private) return `Private Profile`;

  return user.tag;
}

export function isValidSnowflake(str: string): boolean {
  if (isNaN(parseInt(str))) return false;

  if (str.length > 18 || str.length < 17) return false;

  return true;
}

export function isPrivacyBlocked(target: GameProfile, sender: User): boolean {
  if (target.discordId === sender.id) return false;

  if (!target.private) return false;

  if (Zephyr.config.moderators.includes(sender.id)) return false;
  if (Zephyr.config.developers.includes(sender.id)) return false;

  return true;
}

export function canBypass(user: User): boolean {
  if (Zephyr.config.moderators.includes(user.id)) return true;
  if (Zephyr.config.developers.includes(user.id)) return true;

  return false;
}

export function getConditionString(
  condition: 0 | 1 | 2 | 3 | 4 | 5,
  capital: boolean = true
): string {
  const conditionString = [
    `Damaged`,
    `Poor`,
    `Average`,
    `Good`,
    `Great`,
    `Mint`,
  ][condition];

  if (capital) {
    return conditionString;
  } else return conditionString.toLowerCase();
}
