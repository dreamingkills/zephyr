import { Message, TextChannel } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { CardSpawner } from "../../lib/CardSpawner";

export default class ForceFrame extends BaseCommand {
  names = ["forcedrop", "fd"];
  description = `Forcibly drops cards (as if by server activity).`;
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    const cards = this.zephyr.getRandomCards(3);
    await CardSpawner.forceDrop(msg.channel as TextChannel, cards, this.zephyr);
    return;
  }
}
