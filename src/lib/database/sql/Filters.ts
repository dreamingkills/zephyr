import { DB } from "..";

export interface Filter {
  [key: string]: string | number;
}

export class FilterService {
  public static parseOptions(options: Filter): string[] {
    const queryOptions: string[] = [];

    for (let [prop, value] of Object.entries(options)) {
      if (["index", "i", "serial"].indexOf(prop) > -1) {
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
              parseInt(value.toString().slice(1), 10)
            )}`
          );
      }
    }
    return queryOptions;
  }
}
