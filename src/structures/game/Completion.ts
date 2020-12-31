export interface Completion {
  subgroup_name: string;
  group_name: string;
  individual_name: string;
  quantity: string;
}

export class GameCompletion {
  subgroupName: string;
  groupName: string;
  individualName: string;
  quantity: number;

  constructor(data: Completion) {
    this.subgroupName = data.subgroup_name;
    this.groupName = data.group_name;
    this.individualName = data.individual_name;
    this.quantity = parseInt(data.quantity, 10);
  }

  public hasAny(): boolean {
    return this.quantity > 0;
  }
}

export interface TotalCompletion {
  group: string;
  complete: number;
  incomplete: number;
}
