export interface OrpheusCommand {
  id: number;
  command_id: string;
  discord_id: string;
  parameters: string;
  guild_id: string | null;
  channel_id: string;
  message_id: string;
  use_time: string;
  error: boolean;
}
