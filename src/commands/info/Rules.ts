import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { Zephyr } from "../../structures/client/Zephyr";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class Rules extends BaseCommand {
  id = `mirror`;
  names = [`rules`];
  description = `Displays a list of Zephyr game rules.`;
  usage = [`$CMD$ [en/tr/fil/de]`];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const lang = options[0]?.toLowerCase() || `en`;

    const rules = this.rules[lang] || this.rules.en;

    const embed = new MessageEmbed(`Rules`, msg.author).setDescription(rules);

    const prefix = Zephyr.getPrefix(msg.guildID);
    embed.setFooter(
      `See "${prefix}help rules" to view the rules in other languages.`
    );

    await this.send(msg.channel, embed);
    return;
  }

  private rules: { [key: string]: string } = {
    en: `1) **One account per person and one person per account!**\nIt's not fair to the people who play within the rules, so limit yourself to one account and don't share your account with others.\n\n2) **Do not "self-bot" Zephyr**.\n"Self-botting" is automation of any interaction between you and Zephyr. This is also against Discord ToS!\n\n3) **Do not "cross-trade"** or **"real-world trade"**.\n"Cross-trade" is the exchange of any Zephyr goods, services, or currency for goods, services, or currency on other bots or games.\n"Real-world trade" is the exchange of any Zephyr goods, services, or currency for real-world correspondence such as money.\n\n4) **Do not "funnel"** cards, items, or currency.\n"Funnelling" is a very broad term, but it can be defined simply as "feeding" an account resources from one or more accounts (alternate accounts or real people) to gain an advantage.\n\nBreaking **any** of the above rules will result in a blacklist from the game. You will **not** be banned from **Zephyr Community** if you are blacklisted from the game.`,
    tr: `1) **Her hesapta bir kişi, her kişide bir hesap!**\nBu, kurallara uyan oyuncular için adil değil bundan dolayı başkasıyla hesabınızı paylaşmayın ve kendinizi bir hesapla sınırlayın.\n\n2) **Zephyr'e "otomatik-bot" yapmayın.**\n"otomatik-botlama" Zephyr ve senin arandaki etkileşimin otomatikleştirilmesidir. Bu Discord ToS'una da aykırıdır!\n\n3) **"Gerçek Hayat Takası" veya "Çapraz Takas" yapmayın!**\n"çapraz takas" Zephyr ürünlerinin, servislerinin veya paranın başka botlardaki veya oyunlardaki ürünler, servisler veya para için değiş tokuş yapmaktır.\n"gerçek hayat takası" Zephyr ürünlerinin, servislerin veya paranın gerçek hayattaki  para gibi karşılıkları için değiş tokuş etmektir.\n\n4) Kartları, itemleri veya paraları **"hunilemeyin"**\n"hunileme" çok geniş bir terim fakat basitçe "beslemek" olarak tanımlanabilir. Bir veya daha fazla hesaplardan (alternatif hesaplar veya gerçek kişiler) kazanç elde etme.\n\nOyunda, kurallar üzerinden **herhangi** birini ihlal ederseniz, karalisteye alınacaksınız. Oyunda kara listedeysen **Zephyr Community'den** **banlanmayacaksınız**.`,
    fil: `1) **Isang account kada sa isang tao at isang tao kada sa isang account**.\nHindi ito patas sa mga tao na naglalaro sa loob ng mga patakaran, kaya limitahan ang iyong sarili sa isang account at huwag ibahagi ang iyong account sa iba.\n\n2) **Huwag mag-"self-bot" ng Zephyr**.\nAng "self-botting" ay ang awtomasyon ng kahit anong interaksyon mula sa iyo at sa Zephyr. Ito ay labag sa Discord ToS!\n\n3) **Huwag mag "cross-trade"** o **"real-world trade"**.\nAng "cross trade" ay ang pagpalit ng kahit na anong produkto galing Zephyr para sa ibang produkto galing sa ibang mga bot o laro.\nHabang ang "real-world trade" naman ay ang pagpalit ng kahit na anong produktong Zephyr para sa kahit na anong materyal na bagay tulad ng pera.\n\n4) **Huwag mag-"funnel"** ng cards, items, o pera.\nAng "funneling" ay isang malawak na katawagan, ngunit ito ay maitutukoy na pagtipon ng mga resources mula sa isa o higit pang mga accounts (alternate accounts o totoong tao) upang makalamang.\n\nAng paglabag sa **anuman** sa mga patakaran sa itaas ay magreresulta sa isang blacklist mula sa laro. **Hindi** ikaw maiba-ban sa **Zephyr Community** kung ikaw ay na-blacklist mula sa laro.`,
    de: `1) **Ein Account pro Person, und pro Account eine Person!**\nEs ist den Spielern, die sich an die Regeln halten, gegenüber nicht fair, also beschränke dich auf einen Account und teile diesen nicht mit anderen!\n\n2) **Kein Zephyr “Self Botting”**.\n“Self botting” beschreibt den Vorgang in dem Interaktionen zwischen dem Spieler und dem Bot automatisiert werden. Dies verstößt gegen die Discord Nutzungsbedingungen!\n\n3) **Kein “cross-trade” oder “real-world-trade”**.\n“cross-trade”(eng. “übergreifender Handel”) ist das Handeln von Zephyr Gegenständen, Dienstleistungen oder Währungen im Austausch für Gegenstände, Dienstleistungen oder Währungen von anderen Bots oder Spielen.\n“real-world-trade”(eng. Echtwelthandel) bezeichnet das Handeln von Zephyr Gegenständen, Dienstleistungen oder Währungen im Austausch für entsprechende reale Gegenstände, wie Geld.\n\n4) **Kein “funneling” von Karten, Gegenständen oder Währung**.\n“funneling”(eng. trichtern) ist ein sehr breiter Begriff, kann aber definiert werden als Prozess einem Account übermäßig Ressourcen zu zu führen, von einem oder mehreren Accounts (alternative Accounts oder realen Personen), um sich einen Vorteil zu schaffen.\n\nDer Verstoß gegen eine der oben genannten Regeln wird mit einem Ausschluss vom Spiel bestraft. Ein Spielausschluss hat allerdings keinen Bann vom “Zephyr Community” Discord Server zu Folge.`,
  };
}
