import { DB } from "..";
import { GameTag } from "../../../structures/game/Tag";

export interface Filter {
  [key: string]: string | number;
}

export class FilterService {
  public static parseOptions(options: Filter, tags: GameTag[]): string[] {
    const queryOptions: string[] = [];

    for (let [prop, value] of Object.entries(options)) {
      prop = prop.toLowerCase();

      if (["issue", "i", "serial"].includes(prop)) {
        let trueIssue = -1;
        if (!isNaN(parseInt(value.toString(), 10))) {
          trueIssue = parseInt(value.toString(), 10);
        } else if (!isNaN(parseInt(value.toString().slice(1), 10))) {
          trueIssue = parseInt(value.toString().slice(1), 10);
        }

        if (trueIssue < 0) continue;

        if (value.toString().startsWith(">")) {
          queryOptions.push(
            ` user_card.serial_number>${DB.connection.escape(trueIssue)}`
          );
        } else if (value.toString().startsWith("<")) {
          queryOptions.push(
            ` user_card.serial_number<${DB.connection.escape(trueIssue)}`
          );
        } else if (value.toString().startsWith("/")) {
          queryOptions.push(
            ` (user_card.serial_number%${DB.connection.escape(trueIssue)}=0)`
          );
        } else
          queryOptions.push(
            ` user_card.serial_number=${DB.connection.escape(trueIssue)}`
          );
      } else if (["name", "n", "member"].includes(prop)) {
        queryOptions.push(
          ` (alphanum(card_base.individual_name)) LIKE CONCAT('%',alphanum(${DB.connection.escape(
            value
          )}),"%")`
        );
      } else if (["group", "g"].includes(prop)) {
        queryOptions.push(
          ` (alphanum(card_base.group_name)) LIKE CONCAT("%",alphanum(${DB.connection.escape(
            value
          )}),"%")`
        );
      } else if (["subgroup", "sg"].includes(prop)) {
        queryOptions.push(
          ` alphanum(card_base.subgroup_name) LIKE CONCAT("%",alphanum(${DB.connection.escape(
            value
          )}), "%")`
        );
      } else if (["wear", "w", "condition", "c"].includes(prop)) {
        let trueWear = -1;
        if (!isNaN(parseInt(value.toString(), 10))) {
          trueWear = parseInt(value.toString(), 10);
        } else if (!isNaN(parseInt(value.toString().slice(1), 10))) {
          trueWear = parseInt(value.toString().slice(1), 10);
        } else {
          let stringValue = value.toString();
          if (["<", ">"].includes(stringValue[0]))
            stringValue = stringValue.slice(1);

          if (["mint", "m"].includes(stringValue)) {
            trueWear = 5;
          } else if (["great", "gr"].includes(stringValue)) {
            trueWear = 4;
          } else if (["good", "g"].includes(stringValue)) {
            trueWear = 3;
          } else if (["average", "a"].includes(stringValue)) {
            trueWear = 2;
          } else if (["poor", "p"].includes(stringValue)) {
            trueWear = 1;
          } else if (["damaged", "d"].includes(stringValue)) trueWear = 0;
        }

        if (trueWear < 0) continue;

        if (value.toString().startsWith(">")) {
          queryOptions.push(
            ` user_card.wear>${DB.connection.escape(trueWear)}`
          );
        } else if (value.toString().startsWith("<")) {
          queryOptions.push(
            ` user_card.wear<${DB.connection.escape(trueWear)}`
          );
        } else
          queryOptions.push(
            ` user_card.wear=${DB.connection.escape(trueWear)}`
          );
      } else if (["tag", "t"].includes(prop)) {
        const tag = tags.filter(
          (t) => t.name === value.toString()?.toLowerCase()
        )[0];
        if (!value.toString()) {
          queryOptions.push(` user_card.tag_id IS NULL`);
          continue;
        }
        if (tag && value) {
          queryOptions.push(
            ` user_card.tag_id=${DB.connection.escape(tag.id)}`
          );
          continue;
        }

        queryOptions.push(` user_card.tag_id=-1`);
      } else if (["frame", "f"].includes(prop)) {
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
