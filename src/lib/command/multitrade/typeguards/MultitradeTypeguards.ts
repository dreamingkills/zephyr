export function isInteractableItem(value: any): value is InteractableItem {
  return value.hasOwnProperty("item") && value.hasOwnProperty("count");
}

export function isBitItem(value: any): value is InteractableBits {
  return value.hasOwnProperty("bits");
}

export function isCubitItem(value: any): value is InteractableCubits {
  return value.hasOwnProperty("cubits");
}
