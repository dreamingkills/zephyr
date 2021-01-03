import { Message, PartialEmoji } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ReactionCollector } from "eris-collector";
import { GameUserCard } from "../../../structures/game/UserCard";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";

export default class ResetFrame extends BaseCommand {
  names = ["resetframe", "rf"];
  description = "Resets the frame of a card to default.";
  usage = ["$CMD$ <card>"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const rawIdentifier = options[0];
    let card: GameUserCard;
    if (!rawIdentifier) {
      card = await ProfileService.getLastCard(profile);
    } else card = await CardService.getUserCardByIdentifier(rawIdentifier);
    const trueIdentifier = card.id.toString(36);

    if (card.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(card);

    if (card.frameName?.includes("Default"))
      throw new ZephyrError.FrameAlreadyDefaultError(card);

    const conf = await this.send(
      msg.channel,
      `${this.zephyr.config.discord.emoji.warn} Really reset the frame of \`${trueIdentifier}\`?`
    );
    await conf.addReaction(`check:${this.zephyr.config.discord.emojiId.check}`);

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;
    const collector = new ReactionCollector(this.zephyr, conf, filter, {
      time: 30000,
      max: 1,
    });
    collector.on("collect", async () => {
      await CardService.changeCardFrame(card, 1, this.zephyr);
      await conf.edit(
        `${this.zephyr.config.discord.emoji.check} Reset the frame of \`${trueIdentifier}\`.`
      );
      collector.en;
      return;
    });
    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await conf.edit(
          `${this.zephyr.config.discord.emoji.warn} Did not reset the frame.`
        );
        await conf.removeReaction(
          `check:${this.zephyr.config.discord.emojiId.check}`,
          this.zephyr.user.id
        );
        return;
      }
    });
  }
}
