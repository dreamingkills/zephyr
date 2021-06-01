export interface OrpheusMultitrade {
  id: number;
  trade_uuid: string;
  sender: string;
  receiver: string;
  item_type: string;
  item_value: string;
  quantity: number;
  trade_time: string;
  guild_id: string | null;
}
