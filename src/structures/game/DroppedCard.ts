export class GameDroppedCard {
  id: number;
  serialNumber: number;
  frameId: number;

  constructor(data: { id: number; serialNumber: number; frameId: number }) {
    this.id = data.id;
    this.serialNumber = data.serialNumber;

    this.frameId = data.frameId;
  }
}
