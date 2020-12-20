import { Message, PartialEmoji } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { ReactionCollector } from "eris-collector";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class DismantleUntagged extends BaseCommand {
  names = ["dismantleuntagged", "dut"];
  description = "Dismantles all cards that are untagged.";
  usage = ["$CMD$"];

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const cards = await CardService.getUntaggedCards(profile);

    if (cards.length < 1) throw new ZephyrError.NoUntaggedCardsError();

    const individualRewards = cards.map((c) => {
      return Math.round(15 * c.luckCoefficient * ((c.wear || 1) * 1.25));
    });
    const bitReward = individualRewards.reduce((acc, bits) => acc + bits);
    const dustReward = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (let card of cards) {
      if (card.wear === 0) continue;
      dustReward[card.wear]++;
    }

    const descs = CardService.getCardDescriptions(
      cards.slice(0, 5),
      this.zephyr,
      []
    );
    const excess = Math.max(cards.length - 5, 0);

    let description =
      `Really dismantle **${cards.length.toLocaleString()} card${
        cards.length === 1 ? `` : `s`
      }** with **no tag**?\n` +
      descs.join("\n") +
      (excess > 0 ? `\n*... and ${excess.toLocaleString()} more ...*` : ``) +
      `\n\nYou will receive:` +
      `\n:white_medium_small_square: ${this.zephyr.config.discord.emoji.bits} **${bitReward}**`;

    for (let [dust, count] of Object.entries(dustReward)) {
      if (count === 0) continue;
      description += `\n:white_medium_small_square: **${count}x** Dust [\`${"★"
        .repeat(parseInt(dust))
        .padEnd(5, "☆")}\`]`;
    }

    const embed = new MessageEmbed()
      .setAuthor(
        `Bulk Dismantle | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(description);
    const conf = await msg.channel.createMessage({ embed: embed });
    await conf.addReaction(`check:${this.zephyr.config.discord.emojiId.check}`);

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;
    const collector = new ReactionCollector(this.zephyr, conf, filter, {
      time: 30000,
      max: 1,
    });
    collector.on("collect", async () => {
      // We need to check that this user is still the owner, or they can dupe bits
      for (let card of cards) {
        const refetchCard = await CardService.getUserCardById(card.id);
        if (refetchCard.discordId !== msg.author.id) {
          await conf.edit({
            embed: embed.setFooter(
              `⚠️ ${card.id.toString(36)} does not belong to you.`
            ),
          });
          return;
        }
      }

      // Give the card to the bot
      await CardService.dismantleCards(cards, this.zephyr);

      for (let [dust, count] of Object.entries(dustReward)) {
        if (count === 0) continue;
        await ProfileService.addDustToProfile(
          parseInt(dust, 10) as 1 | 2 | 3 | 4 | 5,
          count,
          profile
        );
      }

      const newProfile = await ProfileService.addBitsToProfile(
        profile,
        bitReward
      );

      await conf.edit({
        embed: embed.setFooter(
          `🔥 ${cards.length} card${
            cards.length === 1 ? ` has` : `s have`
          } been destroyed.\nYou now have ${newProfile.bits.toLocaleString()} bits.`
        ),
      });
      return;
    });
    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await conf.edit({
          embed: embed.setFooter(`🕒 This destruction has expired.`),
        });
        await conf.removeReaction(
          `check:${this.zephyr.config.discord.emojiId.check}`,
          this.zephyr.user.id
        );
        return;
      }
    });
  }
}
