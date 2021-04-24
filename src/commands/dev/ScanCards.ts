import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { Logger } from "../../lib/logger/Logger";
import { Zephyr } from "../../structures/client/Zephyr";

export default class ScanCards extends BaseCommand {
  names = ["scancards"];
  description = `Scans base card objects for errors.`;
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    const cards = Zephyr.getCards();

    for (let card of cards) {
      if (!card.groupId) {
        Logger.debug(
          `Card ${card.id} (${card.name}) was loaded without a group - possible bug?`
        );
      }
      if (!card.subgroupId) {
        Logger.debug(
          `Card ${card.id} (${card.name}) was loaded without a subgroup - possible bug?`
        );
      }
      if (!card.image) {
        Logger.debug(
          `Card ${card.id} (${card.name}) was loaded without an image - possible bug?`
        );
      }
    }

    await this.send(msg.channel, `Check console for info.`);
    return;
  }
}
