import dayjs from "dayjs";

export interface BaseCard {
  readonly id: number;
  readonly group_name: string | null;
  readonly group_id: number | null;
  readonly idol_id: number;
  readonly subgroup_id: number | null;
  readonly idol_name: string;
  readonly birthday: string;
  readonly subgroup_name: string | null;
  readonly image_url: string;
  readonly rarity: number;
  readonly serial_total: number;
  readonly serial_limit: number;
  readonly num_generated: number;
  readonly emoji: string | null;
  readonly archived: boolean;
  readonly activated: boolean;
}

export class GameBaseCard {
  readonly id: number;
  readonly group?: string;
  readonly groupId?: number;
  readonly subgroup?: string;
  readonly idolId: number;
  readonly subgroupId?: number;
  readonly name: string;
  readonly image: string;
  readonly rarity: number;
  serialTotal: number;
  readonly serialLimit: number;
  readonly totalGenerated: number;
  readonly emoji?: string;
  readonly archived: boolean;
  readonly birthday?: string;
  readonly activated: boolean;

  constructor(card: BaseCard) {
    this.id = card.id;

    this.group = card.group_name || undefined;
    this.groupId = card.group_id || undefined;

    this.subgroup = card.subgroup_name || undefined;
    this.subgroupId = card.subgroup_id || undefined;

    this.name = card.idol_name;
    this.idolId = card.idol_id;

    this.image = card.image_url;
    this.rarity = card.rarity;
    this.serialLimit = card.serial_limit;
    this.serialTotal = card.serial_total;
    this.totalGenerated = card.num_generated;
    this.emoji = card.emoji || undefined;
    this.archived = card.archived;
    this.activated = card.activated;
    if (card.birthday)
      this.birthday = dayjs(card.birthday).format(`YYYY-MM-DD`);
  }
}
