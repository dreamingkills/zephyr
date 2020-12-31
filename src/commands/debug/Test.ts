import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { ScrollingEmbed } from "../../structures/client/ScrollingEmbed";
import { BaseCommand } from "../../structures/command/Command";

export default class Test extends BaseCommand {
  names = ["test"];
  description = "This is a test command";
  allowDm = true;

  async exec(msg: Message): Promise<void> {
    const items: string[] = [];

    for (let i = 0; i < 50; i++) {
      items.push(`Item ${i}`);
    }

    const embed = new MessageEmbed().setTitle("Scrolling embed test");

    const scrollingEmbed = new ScrollingEmbed(this.zephyr, msg, embed, {
      totalItems: items.length,
      totalPages: Math.ceil(items.length / 10),
      initialItems: items.slice(0, 10).join("\n"),
    });

    scrollingEmbed.onPageChange(async (page) => {
      return items.slice((page - 1) * 10, page * 10).join("\n");
    });

    await scrollingEmbed.send();
  }
}
