import { Message } from "eris";
import { Zephyr } from "../../structures/client/Zephyr";
import { BaseCommand } from "../../structures/command/Command";

export default class RecacheCards extends BaseCommand {
  names = ["recachecards", "rcc"];
  description = `Forces a refresh of the bot's card cache.`;
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    await Zephyr.cacheCards();

    await this.send(
      msg.channel,
      `:white_check_mark: Cached **${Zephyr.getCards().length}** cards.`
    );
    return;
  }
}
