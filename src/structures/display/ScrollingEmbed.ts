import { EmbedField, Message, PartialEmoji } from "eris";
import { MessageEmbed } from "../client/RichEmbed";
import { Zephyr } from "../client/Zephyr";
import { ReactionCollector } from "eris-collector";
import { checkPermission } from "../../lib/ZephyrUtils";
import { createMessage } from "../../lib/discord/message/createMessage";
import { addReaction } from "../../lib/discord/message/addReaction";

export interface ScrollingEmbedOptions {
  initialItems: string | EmbedField[];
  totalPages: number;
  totalItems: number;
  startingPage: number;
  embedDescription: string;
  itemName: string;
  itemNamePlural: string;
}

function isEmbedFields(value: string | EmbedField[]): value is EmbedField[] {
  return !!((value[0] as EmbedField).name && (value[0] as EmbedField).value);
}

type OnPageChangeCallback = (
  page: number,
  message: Message,
  emoji: PartialEmoji,
  userId: string
) => string | Promise<string> | EmbedField[] | Promise<EmbedField[]>;

export class ScrollingEmbed {
  private sentMessage!: Message;
  private currentPage = 1;
  private currentItems: string | EmbedField[];
  private options: ScrollingEmbedOptions;
  private onPageChangeCallback: OnPageChangeCallback = () => "";

  constructor(
    private zephyr: Zephyr,
    private message: Message,
    private embed: MessageEmbed,

    options: Partial<ScrollingEmbedOptions>
  ) {
    this.options = Object.assign(
      {
        initialItems: "",
        embedDescription: "",
        itemName: "entity",
        itemNamePlural: options.itemName ? options.itemName + "s" : "entities",
        totalPages: -1,
        totalItems: -1,
        startingPage: 1,
      },
      options
    );

    this.currentItems = this.options.initialItems;
    this.currentPage = this.options.startingPage;
  }

  public async send() {
    this.generateEmbed();

    this.sentMessage = await createMessage(this.message.channel, this.embed);

    await this.react();
  }

  public onPageChange(callback: OnPageChangeCallback) {
    this.onPageChangeCallback = callback;
  }

  private filter = (_m: Message, _emoji: PartialEmoji, userId: string) =>
    userId === this.message.author.id;

  private generateEmbed() {
    this.embed.setFooter(this.generateFooter());

    if (isEmbedFields(this.currentItems)) {
      this.embed.setDescription(this.options.embedDescription);
      this.embed.fields = [];
      this.currentItems.forEach((item) => this.embed.addField(item));
    } else {
      this.embed.setDescription(
        `${this.options.embedDescription}\n${this.currentItems}`
      );
    }
  }

  private generateFooter(): string {
    let footer = "";

    if (this.options.totalPages >= 0) {
      footer += `Page ${this.currentPage} of ${this.options.totalPages}`;
    }

    if (this.options.totalItems >= 0) {
      if (this.options.totalPages >= 0) footer += " • ";

      footer += `${this.options.totalItems} ${
        this.options.totalItems === 1
          ? this.options.itemName
          : this.options.itemNamePlural
      }`;
    }

    return footer;
  }

  private async react() {
    return new Promise(async (resolve, reject) => {
      if (this.options.totalPages < 2) return;

      const collector = new ReactionCollector(
        this.zephyr,
        this.sentMessage,
        this.filter,
        {
          time: 2 * 60 * 1000,
        }
      );

      collector.on(
        "collect",
        async (message: Message, emoji: PartialEmoji, userId: string) => {
          this.removeReaction(emoji, userId);

          let page = this.currentPage;

          if (emoji.name === "⏮️" && page !== 1) page = 1;
          if (emoji.name === "◀️" && page !== 1) page--;
          if (emoji.name === "▶️" && page !== this.options.totalPages) page++;
          if (
            emoji.name === "⏭️" &&
            this.currentPage !== this.options.totalPages
          )
            page = this.options.totalPages;

          if (page === this.currentPage) return;

          this.currentPage = page;

          Promise.resolve(
            this.onPageChangeCallback(this.currentPage, message, emoji, userId)
          ).then((items) => {
            this.currentItems = items;

            this.generateEmbed();

            this.sentMessage.edit({ embed: this.embed });
          });
        }
      );

      collector.on("error", (e: Error) => {
        reject(e);
      });

      if (this.options.totalPages > -1 && this.options.totalPages > 2)
        await addReaction(this.sentMessage, `⏮️`);
      if (this.options.totalPages > 1)
        await addReaction(this.sentMessage, `◀️`);

      if (this.options.totalPages > 1)
        await addReaction(this.sentMessage, `▶️`);
      if (this.options.totalPages > -1 && this.options.totalPages > 2)
        await addReaction(this.sentMessage, `⏭️`);

      resolve(undefined);
    });
  }

  private async removeReaction(emoji: PartialEmoji, userId: string) {
    if (
      checkPermission("manageMessages", this.message.textChannel, this.zephyr)
    )
      await this.sentMessage.removeReaction(emoji.name, userId);
  }
}
