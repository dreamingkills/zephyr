import dayjs from "dayjs";
import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameBaseCard } from "../../structures/game/BaseCard";

export default class Birthdays extends BaseCommand {
  names = ["birthdays", "bd"];
  description = "Shows a list of birthdays today.";
  usage = ["$CMD$"];
  allowDm = true;

  async exec(msg: Message): Promise<void> {
    const today = dayjs().format(`MM-DD`);
    const birthdays: GameBaseCard[] = [];
    this.zephyr.getCards().forEach((c) => {
      if (!birthdays.find((b) => b.group === c.group && b.name === c.name)) {
        if (today === c.birthday?.slice(5)) birthdays.push(c);
      }
    });

    const embed = new MessageEmbed(`Birthdays`, msg.author).setDescription(
      birthdays.length === 0
        ? `:confused: There are no birthdays today.`
        : `:birthday: Today's birthdays are...\n` +
            birthdays
              .map((c) => {
                const age = dayjs().year() - dayjs(c.birthday).year();
                return `— **${c.group || `Soloist`}** ${c.name} (${age})`;
              })
              .join("\n")
    );

    await this.send(msg.channel, embed);
    return;
  }
}
