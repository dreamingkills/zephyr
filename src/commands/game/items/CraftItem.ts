import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import recipes from "../../../assets/recipes.json";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { renderRecipe } from "../../../lib/utility/text/TextUtils";
import { Recipe } from "../../../structures/game/Recipe";
import { ReactionCollector } from "eris-collector";
import { PrefabItem } from "../../../structures/item/PrefabItem";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { getItemById } from "../../../assets/Items";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class CraftItem extends BaseCommand {
  id = `crescendolls`;
  names = ["craft"];
  description =
    "Crafts ingredients into a result according to a specified recipe.";
  usage = ["$CMD$ <recipe name>"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.UnspecifiedRecipeError();

    const recipeQuery = recipes.filter(
      (r) => r.query === options.join(" ").toLowerCase()
    )[0] as Recipe;

    if (!recipeQuery) throw new ZephyrError.RecipeNotFoundError();

    const requiredBaseItems = recipeQuery.ingredients.map((i) =>
      getItemById(i.itemId)
    ) as PrefabItem[];
    const requiredItemCounts = recipeQuery.ingredients.map((i) => i.count);

    const requiredUserItems = [];

    for (let base of requiredBaseItems) {
      const userItem = await ProfileService.getItem(
        profile,
        base.id,
        base.names[0]
      );

      const ingredientCount =
        requiredItemCounts[requiredBaseItems.indexOf(base)];

      if (userItem.quantity < ingredientCount)
        throw new ZephyrError.NotEnoughOfItemError(base.names[0]);

      requiredUserItems.push(userItem);
    }

    const embed = new MessageEmbed(`Crafting`, msg.author).setDescription(
      `Please confirm that you would like to craft **${
        recipeQuery.name
      }**.\n${renderRecipe(recipeQuery)}` +
        `**Notice**: Crafting is not reversible!`
    );

    const confirmation = await this.send(msg.channel, embed);

    const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
      user.id === msg.author.id &&
      emoji.id === Zephyr.config.discord.emojiId.check;

    const collector = new ReactionCollector(Zephyr, confirmation, filter, {
      time: 30000,
      max: 1,
    });
    collector.on("error", async (e: Error) => {
      await this.handleError(msg, msg.author, e);
    });

    collector.on("collect", async () => {
      await ProfileService.removeItems(
        profile,
        requiredBaseItems.map((b) => {
          return {
            item: b,
            count: requiredItemCounts[requiredBaseItems.indexOf(b)],
          };
        })
      );
      await ProfileService.addItems(
        profile,
        recipeQuery.result.map((r) => {
          const resultBaseItem = getItemById(r.itemId)!;
          return { item: resultBaseItem, count: r.count };
        })
      );

      await confirmation.edit({
        embed: embed.setFooter(`🛠️ You've crafted ${recipeQuery.name}!`),
      });
      collector.stop();
      return;
    });

    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await confirmation.edit({
          embed: embed.setFooter(`🕒 This crafting confirmation has expired.`),
        });
      }

      if (checkPermission(`manageMessages`, msg.channel))
        await confirmation.removeReactions();
    });

    await this.react(
      confirmation,
      `check:${Zephyr.config.discord.emojiId.check}`
    );
    return;
  }
}
