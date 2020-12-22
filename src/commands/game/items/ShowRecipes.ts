import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { recipes } from "../../../assets/recipes.json";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { renderRecipe } from "../../../lib/ZephyrUtils";

export default class ShowRecipes extends BaseCommand {
  names = ["recipes"];
  description = "Shows recipes available to craft.";

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const embed = new MessageEmbed().setAuthor(
      `Recipes | ${msg.author.tag}`,
      msg.author.dynamicAvatarURL("png")
    );

    const prefix = this.zephyr.getPrefix(msg.guildID!);

    for (let recipe of recipes) {
      embed.addField({
        name: recipe.name,
        value: `\`${prefix}craft ${recipe.query}\`\n` + renderRecipe(recipe),
        inline: true,
      });
    }

    await msg.channel.createMessage({ embed });
    return;
  }
}
