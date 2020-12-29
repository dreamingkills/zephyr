import { Message } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { calculateTalent } from "../../../lib/talent";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { GameUserCard } from "../../../structures/game/UserCard";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";

export default class ViewTalent extends BaseCommand {
  names = ["talent", "ta"];
  description = "Inspects the talent of your cards.";
  usage = ["$CMD$ <card>"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    let card: GameUserCard;

    const reference = options[0];
    if (!reference) {
      card = await ProfileService.getLastCard(profile);
    } else card = await CardService.getUserCardByIdentifier(reference);

    if (card.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(card);

    const base = this.zephyr.getCard(card.baseCardId);

    const talent = calculateTalent(profile, card, base);
    const nonzeroTalents = Object.entries(talent)
      .filter((e) => {
        return e[1] > 0;
      })
      .sort((a, b) => (a[1] < b[1] ? 1 : -1));

    let talents = "```xl\n";
    let leftPad = Object.values(talent)
      .sort((a, b) => (a < b ? 1 : -1))[0]
      .toString().length;

    for (let [k, v] of nonzeroTalents) {
      talents += `${v.toString().padStart(leftPad, " ")} ${k.replace(
        k[0],
        k[0].toUpperCase()
      )}\n`;
    }

    talents += `\n\`\`\``;

    const cardImage = await CardService.checkCacheForCard(card, this.zephyr);

    const embed = new MessageEmbed()
      .setAuthor(
        `Talent - ${card.id.toString(36)} | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `Card: ${base.group ? `**${base.group}** ` : ``}${base.name}${
          base.subgroup ? ` (${base.subgroup})` : ``
        }` + talents
      )
      .setThumbnail(`attachment://card.png`);

    await msg.channel.createMessage(
      { embed },
      { file: cardImage, name: "card.png" }
    );
  }
}
