export interface BaseCard {
  id: number;
  identifier: string;
  flavor_text?: string;
  group_name?: string;
  subgroup_name?: string;
  individual_name: string;
  rarity: number;
  serial_total: number;
  serial_limit: number;

  tier_one?: string;
  tier_two?: string;
  tier_three?: string;
  tier_four?: string;
  tier_five?: string;
  tier_six?: string;
}
export interface Frame {
  id: number;
  frame_name: string;
  frame_url: string;
}
export class GameBaseCard {
  id: number;
  identifier: string;
  flavor?: string;
  group?: string;
  subgroup?: string;
  name: string;
  rarity: number;
  serialTotal: number;
  serialLimit: number;

  tierOne?: string;
  tierTwo?: string;
  tierThree?: string;
  tierFour?: string;
  tierFive?: string;
  tierSix?: string;

  maxTier: number;
  constructor(card: BaseCard) {
    this.id = card.id;
    this.identifier = card.identifier;
    this.flavor = card.flavor_text;
    this.group = card.group_name;
    this.subgroup = card.subgroup_name;
    this.name = card.individual_name;
    this.rarity = card.rarity;
    this.serialLimit = card.serial_limit;
    this.serialTotal = card.serial_total;

    this.tierOne = card.tier_one;
    this.tierTwo = card.tier_two;
    this.tierThree = card.tier_three;
    this.tierFour = card.tier_four;
    this.tierFive = card.tier_five;
    this.tierSix = card.tier_six;

    if (card.tier_six) {
      this.maxTier = 6;
    } else if (card.tier_five) {
      this.maxTier = 5;
    } else if (card.tier_four) {
      this.maxTier = 4;
    } else if (card.tier_three) {
      this.maxTier = 3;
    } else if (card.tier_two) {
      this.maxTier = 2;
    } else {
      this.maxTier = 1;
    }
  }
}
export class GameFrame {
  id: number;
  frameName: string;
  frameUrl: string;
  constructor(data: Frame) {
    this.id = data.id;
    this.frameName = data.frame_name;
    this.frameUrl = data.frame_url;
  }
}
