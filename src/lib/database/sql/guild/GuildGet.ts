import { DB } from "../..";

export async function getPrefixes(): Promise<{
  [guildId: string]: string;
}> {
  const query = (await DB.query(`SELECT * FROM guild;`)) as {
    guild_id: string;
    prefix: string;
  }[];
  const prefixes: { [guildId: string]: string } = {};
  for (let setting of query) {
    prefixes[setting.guild_id] = setting.prefix;
  }
  return prefixes;
}

export async function getDropChannel(guildId: string): Promise<string | null> {
  const query = (await DB.query(`SELECT * FROM guild WHERE guild_id=?;`, [
    guildId,
  ])) as {
    guild_id: string;
    prefix: string;
    drop_channel_id: string | null;
  }[];
  return query[0]?.drop_channel_id;
}

export * as GuildGet from "./GuildGet";
