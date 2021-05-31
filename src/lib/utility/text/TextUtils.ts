import { User } from "eris";
import { getItemById } from "../../../assets/Items";
import { Zephyr } from "../../../structures/client/Zephyr";
import { GameAlbumCard } from "../../../structures/game/Album";
import { GameBaseCard } from "../../../structures/game/BaseCard";
import { GameDye } from "../../../structures/game/Dye";
import { GameProfile } from "../../../structures/game/Profile";
import { GameDBQuest } from "../../../structures/game/quest/database/DBQuest";
import { Recipe } from "../../../structures/game/Recipe";
import { GameTag } from "../../../structures/game/Tag";
import { GameUserCard } from "../../../structures/game/UserCard";
import { CardService } from "../../database/services/game/CardService";

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

export function getTruncatedDescription(card: GameUserCard): string {
  let description = ``;

  description += `${
    Zephyr.config.discord.emoji[
      getConditionString(
        card.wear
      ).toLowerCase() as keyof typeof Zephyr.config.discord.emoji
    ]
  } `;

  description += `\`${card.id.toString(36)}\` `;

  const baseCard = Zephyr.getCard(card.baseCardId);

  if (!baseCard) {
    return description + `**Unknown Card**`;
  }

  description += `**${baseCard.group || `Soloist`}** `;
  description += `${baseCard.name} `;
  if (baseCard.subgroup) description += `**(${baseCard.subgroup})**`;

  if (card.unusual) description += ` :sparkles: **Unusual**`;

  return description;
}

export async function getDescriptions(
  targets: (GameUserCard | GameDye)[],
  tags: GameTag[] = [],
  showSubgroup: boolean = false,
  showSerial: boolean = false,
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

  const longestLevel =
    onlyCards.length > 0
      ? CardService.getLevel(
          [...onlyCards].sort((a, b) =>
            CardService.getLevel(a).level.toString().length <
            CardService.getLevel(b).level.toString().length
              ? 1
              : -1
          )[0]
        ).level.toString().length + 2
      : 1;

  const longestCharge =
    [...onlyDyes]
      .sort((a, b) =>
        a?.charges.toString().length < b?.charges.toString().length ? 1 : -1
      )[0]
      ?.charges.toString().length || 1;

  const padRight = Math.max(longestLevel, longestCharge);

  for (let t of targets) {
    if (t instanceof GameUserCard) {
      const baseCard = Zephyr.getCard(t.baseCardId)!;
      const hasTag = tags.filter(
        (tag) => tag.id === (<GameUserCard>t).tagId
      )[0];

      let desc =
        `${hasTag?.emoji || `:white_medium_small_square:`} ` +
        `\`${renderIdentifier(t).padStart(padLeft, ` `)}\` ` +
        `: \`${`★`.repeat(t.wear).padEnd(5, `☆`)}\` ` +
        `: \`${(`LV` + CardService.getLevel(t).level.toString(10)).padEnd(
          padRight,
          ` `
        )}\` ` +
        `**${baseCard.group || `Soloist`}** ` +
        `${baseCard.name} ` +
        `${baseCard.emoji ? `${baseCard.emoji} ` : ``}` +
        `${
          showSubgroup && baseCard.subgroup ? `**(${baseCard.subgroup})** ` : ``
        }` +
        `${showSerial ? `\`#${t.serialNumber}\` ` : ``}` +
        `${albumCards.find((c) => c.cardId === t.id) ? ` 🔖` : ``}`;

      if (t.unusual) desc = `*${desc}*`;

      descriptions.push(desc);
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

export function formatQuest(quest: GameDBQuest): string {
  const description = quest.quest?.description;

  if (!description) return `Unknown Quest`;

  return description
    .replace(`%n`, `**${quest.completion}**`)
    .replace(`%p`, quest.completion === 1 ? `` : `s`);
}
