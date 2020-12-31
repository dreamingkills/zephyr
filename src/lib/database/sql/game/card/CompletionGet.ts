import { DB, DBClass } from "../../..";
import { TotalCompletion } from "../../../../../structures/game/Completion";

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
      ORDER BY 4, 2
    `;

    return (await DB.query(query, [discordId])) as TotalCompletion[];
  }
}
