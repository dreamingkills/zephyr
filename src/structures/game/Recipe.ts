type RecipeItem = {
  readonly itemId: number;
  readonly count: number;
};

export type Recipe = {
  readonly name: string;
  readonly query: string;
  readonly ingredients: RecipeItem[];
  readonly result: RecipeItem[];
};
