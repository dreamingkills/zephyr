import { Message, TextChannel } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardSpawner } from "../../../lib/CardSpawner";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import dayjs from "dayjs";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { getTimeUntil } from "../../../lib/ZephyrUtils";

export default class DropCards extends BaseCommand {
  names = ["drop"];
  description = "Drops three random cards in the channel.";
  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const now = dayjs(Date.now());
    const until = dayjs(profile.dropNext);
    if (now < until)
      throw new ZephyrError.DropCooldownError(getTimeUntil(now, until));

    const cards = this.zephyr.getRandomCards(3);

    await ProfileService.setDropTimestamp(
      profile,
      dayjs(new Date()).add(30, "minute").format(`YYYY/MM/DD HH:mm:ss`)
    );
    await CardSpawner.userDrop(
      <TextChannel>msg.channel,
      cards,
      profile,
      this.zephyr
    );

    return;

    /*
    const embed = new MessageEmbed()
      .setAuthor(`Drop | ${msg.author.tag}`, msg.author.dynamicAvatarURL("png"))
      .setDescription(
        `**${msg.author.username}** is dropping cards!` +
          `\n:one: **${cards[0].identifier}#${
            cards[0].serialTotal + 1
          }** — ${this.zephyr.config.discord.emoji.star.repeat(1)}` +
          `\n:two: **${cards[1].identifier}#${
            cards[1].serialTotal + 1
          }** — ${this.zephyr.config.discord.emoji.star.repeat(1)}` +
          `\n:three: **${cards[2].identifier}#${
            cards[2].serialTotal + 1
          }** — ${this.zephyr.config.discord.emoji.star.repeat(1)}`
      )
      .setFooter(`⬇️ Use the buttons to claim!`);

    const collage = await CardService.generateCardCollege(droppedCards);
    await msg.channel.createMessage(
      { embed },
      { file: collage, name: "collage.png" }
    );*/
  }
}
