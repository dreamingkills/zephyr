type RecipeItem = {
  itemId: number;
  count: number;
};

export type Recipe = {
  name: string;
  query: string;
  ingredients: RecipeItem[];
  result: RecipeItem[];
};
