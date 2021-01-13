import { EmbedField } from "eris";
import { MessageEmbed } from "../client/RichEmbed";

export class GridDisplay {
  constructor(private items: string[]) {
    if (items.length > 36) {
      throw new Error("Can't display more than 36 items!");
    }
  }

  public render(embed: MessageEmbed): void {
    const chunks = this.chunkItems();

    chunks
      .map((chunk) => ({
        name: "\u200b",
        value: chunk.join("\n"),
        inline: true,
      }))
      .forEach((field) => embed.addField(field));
  }

  public getFields(): EmbedField[] {
    return this.chunkItems().map((chunk) => ({
      name: "\u200b",
      value: chunk.join("\n"),
      inline: true,
    }));
  }

  private chunkItems(): string[][] {
    if (this.items.length <= 4)
      return this.createChunks({ into: 4, groupsOf: 1 });
    if (this.items.length <= 6)
      return this.createChunks({ into: 3, groupsOf: 2 });

    return this.createChunks({
      into: Math.ceil(this.items.length / 3),
      groupsOf: 3,
    });
  }

  // { into, groupsOf } gets destructured which
  // is why the type annotation looks odd
  private createChunks({
    into,
    groupsOf,
  }: {
    into: number;
    groupsOf: number;
  }): string[][] {
    const chunks = [] as string[][];

    for (let i = 0; i < groupsOf; i++) {
      chunks.push(this.items.slice(i * into, (i + 1) * into));
    }

    return chunks;
  }
}
