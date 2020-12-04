export class GameDroppedCard {
  id: number;
  identifier: string;
  serialNumber: number;
  frameId: number;

  constructor(data: {
    id: number;
    identifier: string;
    serialNumber: number;
    frameId: number;
  }) {
    this.id = data.id;
    this.identifier = data.identifier;
    this.serialNumber = data.serialNumber;

    this.frameId = data.frameId;
  }
}
