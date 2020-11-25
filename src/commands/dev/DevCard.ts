import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import { createCanvas, loadImage } from "canvas";

export default class DevCard extends BaseCommand {
  names = ["dcard"];
  description = `Views debug information about a given card.`;
  developerOnly = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const cardId = parseInt(this.options[0]);
    if (isNaN(cardId)) return;

    const card = this.zephyr.cards[cardId];
    if (!card) {
      const embed = new MessageEmbed()
        .setAuthor(
          `Dev Card | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(
          `There is no card with that ID.` + `\nRemember to try re-caching.`
        );
      await msg.channel.createMessage({ embed });
      return;
    }

    const embed = new MessageEmbed()
      .setAuthor(
        `Dev Card | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .addField({
        name: `Card Data`,
        value:
          `**Card ID**: ${card.id}` +
          `\n**Unique ID**: ${card.identifier}` +
          `\n**Flavor Text**: ${card.flavor || "*none*"}` +
          `\n**Group Name**: ${card.group || "*none*"}` +
          `\n**Subgroup Name**: ${card.subgroup || "*none*"}` +
          `\n**Individual Name**: ${card.name}` +
          `\n**Rarity**: ${card.rarity}` +
          `\n**Serial Total**: ${card.serialTotal.toLocaleString()}` +
          `\n**Serial Limit**: ${card.serialLimit.toLocaleString()}`,
        inline: true,
      })
      .addField({
        name: `Image Data`,
        value:
          `**T1**: ${card.tierOne || "*none*"}` +
          `\n**T2**: ${card.tierTwo || "*none*"}` +
          `\n**T3**: ${card.tierThree || "*none*"}` +
          `\n**T4**: ${card.tierFour || "*none*"}` +
          `\n**T5**: ${card.tierFive || "*none*"}` +
          `\n**T6**: ${card.tierSix || "*none*"}`,
        inline: true,
      });

    const canvas = createCanvas(700, 1000);
    const ctx = canvas.getContext("2d");

    const dir = `./src/assets/cards/${card.id}`;
    const img = await loadImage(`${dir}/one.png`);
    const overlay = await loadImage(`${dir}/overlay.png`);
    const frame = await loadImage(`./src/assets/frames/white.png`);

    ctx.drawImage(img, 0, 0, 700, 1000);
    ctx.drawImage(frame, 0, 0, 700, 1000);
    ctx.drawImage(overlay, 0, 0, 700, 1000);

    const buf = canvas.toBuffer("image/png");
    const final = Buffer.alloc(buf.length, buf, "base64");
    await msg.channel.createMessage(
      { embed },
      { file: final, name: "card.png" }
    );
    return;
  }
}
