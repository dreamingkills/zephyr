import { Message } from "eris";
import { MessageEmbed } from "./RichEmbed";
import { MessageCollector } from "eris-collector";
import { Zephyr } from "./Zephyr";

export class ChoiceEmbed {
  constructor(
    private zephyr: Zephyr,
    private originalMessage: Message,
    private embed: MessageEmbed,
    private choices: string[]
  ) {}

  private get filter() {
    return (m: Message) =>
      this.choices[parseInt(m.content, 10) - 1] &&
      m.author.id === this.originalMessage.author.id;
  }

  async ask(): Promise<number | undefined> {
    this.generateEmbed();

    const choiceMessage = await this.originalMessage.channel.createMessage({
      embed: this.embed,
    });

    return this.listen(choiceMessage);
  }

  private generateEmbed() {
    this.embed.setDescription(
      this.embed.description +
        `\n${this.choices.map((c, idx) => `— \`${idx + 1}\` ${c}`).join("\n")}`
    );
  }

  private listen(choiceMessage: Message): Promise<number | undefined> {
    return new Promise((resolve) => {
      const collector = new MessageCollector(
        this.zephyr,
        this.originalMessage.channel,
        this.filter,
        {
          time: 15000,
          max: 1,
        }
      );

      collector.on("collect", async (m: Message) => {
        resolve(parseInt(m.content, 10) - 1);
      });

      collector.on("end", async (_c: any, reason: string) => {
        if (reason === "time") {
          await choiceMessage.edit({
            embed: this.embed.setFooter(`🕒 This lookup has timed out.`),
          });
          resolve(undefined);
        }
      });
    });
  }
}
