import { DB } from "..";
import { GameProfile } from "../../../structures/game/Profile";
import { ProfileService } from "../services/game/ProfileService";

export interface Filter {
  [key: string]: string | number;
}

export class FilterService {
  public static async parseOptions(
    options: Filter,
    profile: GameProfile
  ): Promise<string[]> {
    const queryOptions: string[] = [];

    for (let [prop, value] of Object.entries(options)) {
      if (["issue", "i", "serial"].indexOf(prop) > -1) {
        if (value.toString().startsWith(">")) {
          queryOptions.push(
            ` user_card.serial_number>${DB.connection.escape(
              value.toString().slice(1)
            )}`
          );
        } else if (value.toString().startsWith("<")) {
          queryOptions.push(
            ` user_card.serial_number<${DB.connection.escape(
              value.toString().slice(1)
            )}`
          );
        } else
          queryOptions.push(
            ` user_card.serial_number=${DB.connection.escape(
              parseInt(value as string, 10)
            )}`
          );
      } else if (["name", "n", "member"].indexOf(prop) > -1) {
        queryOptions.push(
          ` (alphanum(card_base.individual_name)) LIKE CONCAT("%",alphanum(${DB.connection.escape(
            value
          )}),"%")`
        );
      } else if (["group", "g"].indexOf(prop) > -1) {
        queryOptions.push(
          ` (alphanum(card_base.group_name)) LIKE CONCAT("%",alphanum(${DB.connection.escape(
            value
          )}),"%")`
        );
      } else if (["wear", "w"].indexOf(prop) > -1) {
        if (value.toString().startsWith(">")) {
          queryOptions.push(
            ` user_card.wear>${DB.connection.escape(
              parseInt(value.toString().slice(1), 10)
            )}`
          );
        } else if (value.toString().startsWith("<")) {
          queryOptions.push(
            ` user_card.wear<${DB.connection.escape(
              parseInt(value.toString().slice(1), 10)
            )}`
          );
        } else
          queryOptions.push(
            ` user_card.wear=${DB.connection.escape(
              parseInt(value.toString(), 10)
            )}`
          );
      } else if (["tag", "t"].indexOf(prop) > -1) {
        const tags = await ProfileService.getTags(profile);
        const tag = tags.filter(
          (t) => t.name === value.toString()?.toLowerCase()
        )[0];
        if (!tag) continue;

        queryOptions.push(` user_card.tag_id=${DB.connection.escape(tag.id)}`);
      } else if (["frame", "f"].indexOf(prop) > -1) {
        if (value === "true") {
          queryOptions.push(` user_card.frame!=1`);
        } else if (value === "false") {
          queryOptions.push(` user_card.frame=1`);
        }
      }
    }
    return queryOptions;
  }
}
