import { Message } from "eris";
import { ItemService } from "../../lib/ItemService";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";

export default class RefreshItems extends BaseCommand {
  names = ["refreshitems"];
  description = `Refreshes the item list.`;
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    const oldCount = ItemService.items.length;

    ItemService.refreshItems();

    const newCount = ItemService.items.length;

    const embed = new MessageEmbed(`Refresh Items`, msg.author).setDescription(
      `Refreshed the item list.\n**${oldCount}** items -> **${newCount}** items.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
