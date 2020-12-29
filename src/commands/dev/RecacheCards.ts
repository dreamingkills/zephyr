import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";

export default class RecacheCards extends BaseCommand {
  names = ["recachecards", "rcc"];
  description = `Forces a refresh of the bot's card cache.`;
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    await this.zephyr.cacheCards();
    await msg.channel.createMessage(
      `:white_check_mark: Cached **${this.zephyr.getCards().length}** cards.`
    );
  }
}
