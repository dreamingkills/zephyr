import { Dayjs } from "dayjs";
import { Channel, TextChannel } from "eris";
import { Zephyr } from "../structures/client/Zephyr";
import nearestColor from "nearest-color";
import colorNames from "color-name-list";
import { Recipe } from "../structures/game/Recipe";
import { items } from "../assets/items.json";
import { GameDye } from "../structures/game/Dye";
import { GameUserCard } from "../structures/game/UserCard";
import { GameTag } from "../structures/game/Tag";
import { ErisFile } from "../structures/client/ErisFile";

const mappedColors = colorNames.reduce(
  (o, { name, hex }) => Object.assign(o, { [name]: hex }),
  {}
);

function strToInt(text: string): number {
  let result = parseInt(text.replace(/[, ]+/g, ""), 10);
  if (text.toLowerCase().endsWith("k")) result *= 1000;
  if (text.toLowerCase().endsWith("m")) result *= 1000000;
  if (text.toLowerCase().endsWith("b")) result *= 1000000000;
  return result;
}

function padIfNotLeading(text: string | number, leading: boolean): string {
  return leading ? text.toString() : text.toString().padStart(2, "0");
}

function getTimeUntilNextDay(timestamp: Dayjs): string {
  const nextDay = timestamp.add(1, "day");

  const days = nextDay.diff(Date.now(), "d");
  const hours = nextDay.diff(Date.now(), "h");
  const minutes = nextDay.diff(Date.now(), "m") - hours * 60;
  const seconds =
    nextDay.diff(Date.now(), "s") - nextDay.diff(Date.now(), "m") * 60;

  const daysText = days > 0 ? `${days}d ` : ``;
  const hoursText =
    hours > 0 ? `${padIfNotLeading(hours - days * 24, days === 0)}h ` : ``;
  const minutesText =
    minutes > 0 ? `${padIfNotLeading(minutes, hours === 0)}m ` : ``;
  const secondsText =
    seconds > 0 ? `${padIfNotLeading(seconds, minutes === 0)}s` : ``;

  return (
    `${daysText}` +
    `${hoursText}` +
    `${minutesText}` +
    `${secondsText}`
  ).trim();
}

function getTimeUntil(from: Dayjs, to: Dayjs): string {
  const days = to.diff(from, "d");
  const hours = to.diff(from, "h");
  const minutes = to.diff(from, "m") - hours * 60;
  const seconds = to.diff(from, "s") - to.diff(from, "m") * 60;

  const daysText = days > 0 ? `${days}d ` : ``;
  const hoursText =
    hours > 0 ? `${padIfNotLeading(hours - days * 24, days === 0)}h ` : ``;
  const minutesText =
    minutes > 0 ? `${padIfNotLeading(minutes, hours === 0)}m ` : ``;
  const secondsText =
    seconds > 0 ? `${padIfNotLeading(seconds, minutes === 0)}s` : ``;

  return (
    `${daysText}` +
    `${hoursText}` +
    `${minutesText}` +
    `${secondsText}`
  ).trim();
}

function checkPermission(
  permission: string,
  channel: Channel,
  zephyr: Zephyr
): boolean {
  if (channel.type !== 0) return false;
  return (<TextChannel>channel).permissionsOf(zephyr.user.id).json[permission];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (hex.startsWith("#")) hex = hex.slice(1);
  const big = parseInt(hex, 16);
  return {
    r: (big >> 16) & 255,
    g: (big >> 8) & 255,
    b: big & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getNearestColor(
  hex: string
): {
  name: string;
  value: string;
  rgb: { r: number; g: number; b: number };
  distance: number;
} {
  const nearest = nearestColor.from(mappedColors);
  const trueNearest = nearest(hex) as {
    name: string;
    value: string;
    rgb: { r: number; g: number; b: number };
    distance: number;
  };

  return trueNearest;
}

function renderRecipe(recipe: Recipe): string {
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

function getDescriptions(
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

function rgbToCmy(
  r: number,
  g: number,
  b: number
): { c: number; m: number; y: number } {
  return {
    c: (1 - r / 255) * 100,
    m: (1 - g / 255) * 100,
    y: (1 - b / 255) * 100,
  };
}

function isFile(body: any): body is ErisFile {
  return !!(body as ErisFile).file;
}

function escapeMarkdown(value: string): string {
  const unescaped = value.replace(/\\(\*|_|`|~|\\)/g, "$1"); // un-escape backslashed characters
  return unescaped.replace(/(\*|_|`|~|\\)/g, "\\$1"); // escape *, _, `, ~, \
}

export {
  padIfNotLeading,
  getTimeUntilNextDay,
  checkPermission,
  getTimeUntil,
  strToInt,
  hexToRgb,
  rgbToHex,
  getNearestColor,
  renderRecipe,
  getDescriptions,
  rgbToCmy,
  isFile,
  escapeMarkdown,
};
