import { Message } from "eris";
import { MessageEmbed } from "../client/RichEmbed";
import { MessageCollector } from "eris-collector";
import { Zephyr } from "../client/Zephyr";
import { createMessage } from "../../lib/discord/message/createMessage";

export class ChoiceEmbed {
  readonly maxEntries = 2;
  private hasMaxEntries: boolean;
  private choices: string[];

  constructor(
    private zephyr: Zephyr,
    private originalMessage: Message,
    private embed: MessageEmbed,
    choices: string[]
  ) {
    this.hasMaxEntries = choices.length > this.maxEntries;
    this.choices = choices.splice(0, this.maxEntries);
  }

  private get filter() {
    return (m: Message) =>
      this.choices[parseInt(m.content, 10) - 1] &&
      m.author.id === this.originalMessage.author.id;
  }

  async ask(): Promise<number | undefined> {
    this.generateEmbed();

    const choiceMessage = await createMessage(
      this.originalMessage.channel,
      this.embed
    );

    return this.listen(choiceMessage);
  }

  private generateEmbed() {
    this.embed.setDescription(
      (this.embed.description || "") +
        `\n${this.choices.map((c, idx) => `— \`${idx + 1}\` ${c}`).join("\n")}`
    );

    if (this.hasMaxEntries)
      this.embed.setFooter(
        (this.embed.footer?.text ? this.embed.footer.text + "\n" : "") +
          "There were too many results to display, try narrowing your search down.",
        this.embed.footer?.icon_url
      );
  }

  private listen(choiceMessage: Message): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
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

      collector.on("error", (e: Error) => {
        reject(e);
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
