export interface OrpheusBitTransaction {
  id: number;
  giver: string;
  recipient: string;
  amount: number;
  guild_id: string;
  transaction_time: string;
}
