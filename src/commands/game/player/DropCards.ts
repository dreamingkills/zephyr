import { Message, PartialEmoji } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { Chance } from "chance";
import { CardService } from "../../../lib/database/services/game/CardService";
import { GameUserCard } from "../../../structures/game/UserCard";
import { ReactionCollector } from "eris-collector";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";

export default class DropCards extends BaseCommand {
  names = ["drop"];
  description = "Drops three random cards in the channel.";

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const chance = new Chance();
    const cards = chance.pickset(Object.values(this.zephyr.cards), 3);

    const pics: GameUserCard[] = [];
    for (let card of cards) {
      const tier = chance.weighted(
        [1, 2, 3, 4, 5, 6].slice(0, card.maxTier),
        [1000, 80, 20, 7, 1.5, 0.1].slice(0, card.maxTier)
      );
      const userCard = new GameUserCard({
        id: 0,
        card_id: card.id,
        serial_number: card.serialTotal + 1,
        discord_id: "0",
        tier,
        frame: "white",
      });
      pics.push(userCard);
    }

    const embed = new MessageEmbed()
      .setAuthor(`Drop | ${msg.author.tag}`, msg.author.dynamicAvatarURL("png"))
      .setDescription(
        `**${msg.author.username}** is dropping cards!` +
          `\n:one: **${cards[0].identifier}#${
            cards[0].serialTotal + 1
          }** — ${this.zephyr.config.discord.emoji.star.repeat(pics[0].tier)}` +
          `\n:two: **${cards[1].identifier}#${
            cards[1].serialTotal + 1
          }** — ${this.zephyr.config.discord.emoji.star.repeat(pics[1].tier)}` +
          `\n:three: **${cards[2].identifier}#${
            cards[2].serialTotal + 1
          }** — ${this.zephyr.config.discord.emoji.star.repeat(pics[2].tier)}`
      )
      .setFooter(`⬇️ Use the buttons to claim!`);

    const collage = await CardService.generateCardCollage(pics);

    const drop = await msg.channel.createMessage(
      {
        embed,
      },
      { file: collage, name: "collage.png" }
    );

    const filter = (_m: Message, emoji: PartialEmoji, userID: string) =>
      ["1️⃣", "2️⃣", "3️⃣"].includes(emoji.name) && userID !== this.zephyr.user.id;
    const collector = new ReactionCollector(this.zephyr, drop, filter, {
      time: 30000,
    });
    let [one, two, three] = [false, false, false];
    const takers: string[] = [];

    collector.on(
      "collect",
      async (_m: Message, emoji: PartialEmoji, userID: string) => {
        if (emoji.name === "1️⃣" && !one && takers.indexOf(userID) < 0) {
          one = true;
          takers.push(userID);
          const profile = await ProfileService.getProfile(userID);
          const card = await CardService.createNewUserCard(
            cards[0],
            profile,
            this.zephyr,
            0,
            pics[0].tier
          );
          await msg.channel.createMessage(
            `<@${userID}> claimed ` +
              `**${CardService.parseReference(
                card,
                cards[0]
              )}** — ${this.zephyr.config.discord.emoji.star.repeat(
                card.tier
              )}!`
          );
        } else if (emoji.name === "2️⃣" && !two && takers.indexOf(userID) < 0) {
          two = true;
          takers.push(userID);
          const profile = await ProfileService.getProfile(userID);
          const card = await CardService.createNewUserCard(
            cards[1],
            profile,
            this.zephyr,
            0,
            pics[1].tier
          );
          await msg.channel.createMessage(
            `<@${userID}> claimed ` +
              `**${CardService.parseReference(
                card,
                cards[1]
              )}** — ${this.zephyr.config.discord.emoji.star.repeat(
                card.tier
              )}!`
          );
        } else if (
          emoji.name === "3️⃣" &&
          !three &&
          takers.indexOf(userID) < 0
        ) {
          three = true;
          takers.push(userID);
          const profile = await ProfileService.getProfile(userID);
          const card = await CardService.createNewUserCard(
            cards[2],
            profile,
            this.zephyr,
            0,
            pics[2].tier
          );
          await msg.channel.createMessage(
            `<@${userID}> claimed ` +
              `**${CardService.parseReference(
                card,
                cards[2]
              )}** — ${this.zephyr.config.discord.emoji.star.repeat(
                card.tier
              )}!`
          );
        }
        if (one && two && three) collector.stop();
      }
    );
    collector.on("end", async () => {
      try {
        await drop.delete();
      } catch {
      } finally {
        return;
      }
    });

    try {
      await Promise.all([
        drop.addReaction("1️⃣"),
        drop.addReaction("2️⃣"),
        drop.addReaction("3️⃣"),
      ]);
    } catch {}
  }
}
