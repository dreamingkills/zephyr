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

export interface GroupCompletion {
  group_name: string;
  subgroup_name: string;
  is_complete: boolean;
  missing: number;
  have: number;
}

export class GameGroupCompletion {
  groupName: string;
  subgroupName: string;
  isComplete: boolean;
  missing: number;
  have: number;

  constructor(data: GroupCompletion) {
    this.groupName = data.group_name;
    this.subgroupName = data.subgroup_name;
    this.isComplete = data.is_complete;
    this.missing = data.missing;
    this.have = data.have;
  }
}
