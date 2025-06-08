export type ActionType = "view" | "like";

export type Count = {
  value: number;
  formatted: string;
  abv: string;
  ns: string;
  action: ActionType;
  key: string;
  iconSvg: string;
};
