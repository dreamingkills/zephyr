import dayjs from "dayjs";
import { Message } from "eris";
import { getGroupsByIdolId } from "../../lib/utility/text/TextUtils";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameBaseCard } from "../../structures/game/BaseCard";

export default class Birthdays extends BaseCommand {
  names = [`birthdays`, `bd`, `bday`];
  description = `Shows a list of birthdays today.`;
  usage = ["$CMD$"];
  allowDm = true;

  async exec(msg: Message): Promise<void> {
    const today = dayjs().format(`MM-DD`);
    const birthdays: GameBaseCard[] = [];
    this.zephyr.getCards().forEach((c) => {
      if (!birthdays.find((b) => b.idolId === c.idolId)) {
        if (today === c.birthday?.slice(5)) birthdays.push(c);
      }
    });

    const embed = new MessageEmbed(`Birthdays`, msg.author)
      .setDescription(
        birthdays.length === 0
          ? `:confused: There are no birthdays today.`
          : `:birthday: Today's birthdays are...\n` +
              birthdays
                .map((c) => {
                  const age = dayjs().year() - dayjs(c.birthday).year();
                  const groups = getGroupsByIdolId(
                    c.idolId,
                    this.zephyr.getCards()
                  );

                  return `— ${age}: **${c.name}** (${groups.join(`, `)})`;
                })
                .join("\n")
      )
      .setFooter(`All idols have a 2.5x droprate on their birthday!`);

    await this.send(msg.channel, embed);
    return;
  }
}
