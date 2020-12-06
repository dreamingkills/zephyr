export class GameDroppedCard {
  baseCardId: number;
  serialNumber: number;
  frameId: number;
  frameUrl: string;

  constructor(data: {
    baseCardId: number;
    serialNumber: number;
    frameId: number;
    frameUrl: string;
  }) {
    this.baseCardId = data.baseCardId;
    this.serialNumber = data.serialNumber;

    this.frameId = data.frameId;
    this.frameUrl = data.frameUrl;
  }
}
