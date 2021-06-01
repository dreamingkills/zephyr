import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { OrpheusService } from "../../lib/database/services/orpheus/OrpheusService";
import dayjs from "dayjs";
import { Zephyr } from "../../structures/client/Zephyr";

export default class OrpheusGiftViewer extends BaseCommand {
  id = `frantic`;
  names = [`ops_gift`];
  description = `Given a gift ID, shows information about it.`;
  usage = [`$CMD$ <gift id>`];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (
      !Zephyr.config.moderators.includes(msg.author.id) &&
      !Zephyr.config.developers.includes(msg.author.id)
    )
      return;

    const giftId = parseInt(options[0]);

    if (!giftId || isNaN(giftId) || giftId < 1) {
      const embed = new MessageEmbed(`Orpheus Gift`, msg.author).setDescription(
        `Please enter a valid gift ID.`
      );

      await this.send(msg.channel, embed);
      return;
    }

    const gift = await OrpheusService.getGiftById(giftId);

    if (!gift) {
      const embed = new MessageEmbed(`Orpheus Gift`, msg.author).setDescription(
        `There is no gift with that ID.`
      );

      await this.send(msg.channel, embed);
      return;
    }

    const embed = new MessageEmbed(`Orpheus Gift`, msg.author)
      .setTitle(`Gift ID ${gift.id}`)
      .setDescription(
        `__**Card:**__ \`${gift.card_id.toString(36)}\`\n__**Sender:**__ ${
          gift.giver
        }\n__**Receiver:**__ ${gift.recipient}\n\n__**Time:**__ \`${dayjs(
          gift.gift_time
        ).format(`YYYY-MM-DD HH:mm:ss`)}\`\n__**Server:**__ \`${
          gift.guild_id
        }\``
      );

    await this.send(msg.channel, embed);
    return;
  }
}
