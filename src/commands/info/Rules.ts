import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class Rules extends BaseCommand {
  id = `mirror`;
  names = [`rules`];
  description = `Displays a list of Zephyr game rules.`;
  usage = [`$CMD$ [en/tr]`];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const lang = options[0]?.toLowerCase() || `en`;

    const rules = this.rules[lang] || this.rules.en;

    const embed = new MessageEmbed(`Rules`, msg.author).setDescription(rules);

    const prefix = this.zephyr.getPrefix(msg.guildID);
    embed.setFooter(
      `See "${prefix}help rules" to view the rules in other languages.`
    );

    await this.send(msg.channel, embed);
    return;
  }

  private rules: { [key: string]: string } = {
    en: `1) **One account per person and one person per account!**\nIt's not fair to the people who play within the rules, so limit yourself to one account and don't share your account with others.\n\n2) **Do not "self-bot" Zephyr**.\n"Self-botting" is automation of any interaction between you and Zephyr. This is also against Discord ToS!\n\n3) **Do not "cross-trade"** or **"real-world trade"**.\n"Cross-trade" is the exchange of any Zephyr goods, services, or currency for goods, services, or currency on other bots or games.\n"Real-world trade" is the exchange of any Zephyr goods, services, or currency for real-world correspondence such as money.\n\n4) **Do not "funnel"** cards, items, or currency.\n"Funnelling" is a very broad term, but it can be defined simply as "feeding" an account resources from one or more accounts (alternate accounts or real people) to gain an advantage.\n\nBreaking **any** of the above rules will result in a blacklist from the game. You will **not** be banned from **Zephyr Community** if you are blacklisted from the game.`,
    tr: `1) **Her hesapta bir kişi, her kişide bir hesap!**\nBu, kurallara uyan oyuncular için adil değil bundan dolayı başkasıyla hesabınızı paylaşmayın ve kendinizi bir hesapla sınırlayın.\n\n2) **Zephyr'e "otomatik-bot" yapmayın.**\n"otomatik-botlama" Zephyr ve senin arandaki etkileşimin otomatikleştirilmesidir. Bu Discord ToS'una da aykırıdır!\n\n3) **"Gerçek Hayat Takası" veya "Çapraz Takas" yapmayın!**\n"çapraz takas" Zephyr ürünlerinin, servislerinin veya paranın başka botlardaki veya oyunlardaki ürünler, servisler veya para için değiş tokuş yapmaktır.\n"gerçek hayat takası" Zephyr ürünlerinin, servislerin veya paranın gerçek hayattaki  para gibi karşılıkları için değiş tokuş etmektir.\n\n4) Kartları, itemleri veya paraları **"hunilemeyin"**\n"hunileme" çok geniş bir terim fakat basitçe "beslemek" olarak tanımlanabilir. Bir veya daha fazla hesaplardan (alternatif hesaplar veya gerçek kişiler) kazanç elde etme.\n\nOyunda, kurallar üzerinden **herhangi** birini ihlal ederseniz, karalisteye alınacaksınız. Oyunda kara listedeysen **Zephyr Community'den** **banlanmayacaksınız**.`,
  };
}
