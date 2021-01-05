import { DB, DBClass } from "../../..";
import {
  Completion,
  GameCompletion,
  GroupCompletion,
  TotalCompletion,
  GameGroupCompletion,
} from "../../../../../structures/game/Completion";

export abstract class CompletionGet extends DBClass {
  public static async totalCompletion(
    discordId: string
  ): Promise<TotalCompletion[]> {
    const query = `
      SELECT
        group_name AS "group",
        sum(is_complete) AS complete,
        count(CASE WHEN is_complete=0 THEN 1 ELSE NULL END) AS incomplete,
        sum(is_complete) / count(CASE WHEN is_complete=0 THEN 1 ELSE NULL END) AS percentage
      FROM (
        SELECT
          COALESCE(group_name, individual_name) AS group_name,
          subgroup_name,
          min(quantity) > 0 AS is_complete
        FROM (
          SELECT individual_name, group_name, subgroup_name, count(user_card.id) AS quantity
          FROM user_card
          RIGHT JOIN card_base
            ON user_card.card_id=card_base.id AND discord_id=?
          GROUP BY group_name, subgroup_name, individual_name
        ) subgroup_completion
        GROUP BY group_name, subgroup_name 
      ) group_completion
      GROUP BY group_name
      ORDER BY 1
    `;

    return (await DB.query(query, [discordId])) as TotalCompletion[];
  }

  public static async subgroupCompletion(
    discordId: string,
    group: string | undefined,
    subgroup: string
  ): Promise<GameCompletion[]> {
    const query = (await DB.query(
      `SELECT individual_name, COALESCE(group_name, individual_name) as group_name, subgroup_name, count(user_card.id) AS quantity FROM user_card
       RIGHT JOIN card_base ON user_card.card_id=card_base.id AND discord_id=?
       WHERE ${
         group ? "group_name=?" : "group_name IS NULL"
       } AND subgroup_name=?
       GROUP BY group_name, subgroup_name, individual_name`,
      group ? [discordId, group, subgroup] : [discordId, subgroup]
    )) as Completion[];

    return query.map((c) => new GameCompletion(c));
  }

  public static async groupCompletion(
    discordId: string,
    group: string
  ): Promise<GameGroupCompletion[]> {
    const query = (await DB.query(
      `
      SELECT
        COALESCE(group_name, individual_name) AS group_name,
        subgroup_name,
        min(quantity) > 0 AS is_complete,
        count(CASE WHEN quantity=0 THEN 1 ELSE NULL END) as missing,
        count(CASE WHEN quantity>0 THEN 1 ELSE NULL END) as have
      FROM (
        SELECT individual_name, group_name, subgroup_name, count(user_card.id) AS quantity
        FROM user_card
        RIGHT JOIN card_base
          ON user_card.card_id=card_base.id AND discord_id=?
        WHERE COALESCE(group_name, individual_name)=?
        GROUP BY subgroup_name, individual_name
      ) subgroup_completion
      GROUP BY subgroup_name`,
      [discordId, group]
    )) as GroupCompletion[];

    return query.map((c) => new GameGroupCompletion(c));
  }

  public static async memberCompletion(
    discordId: string,
    group: string | undefined,
    individualName: string
  ): Promise<GameCompletion[]> {
    const query = (await DB.query(
      `
      SELECT individual_name, group_name, subgroup_name, count(user_card.id) AS quantity FROM user_card
      RIGHT JOIN card_base ON user_card.card_id=card_base.id AND discord_id=?
      WHERE ${
        group ? "group_name=?" : "group_name IS NULL"
      } AND individual_name=?
      GROUP BY group_name, subgroup_name, individual_name
    `,
      group ? [discordId, group, individualName] : [discordId, individualName]
    )) as Completion[];

    return query.map((c) => new GameCompletion(c));
  }
}
