export interface Config {
  host: string;
  port: number;
  user: string;
  password: string;
  nickname: string;
  serverId: number;
  checkPeriod: number;
  afkChannelId: number;
  excludeChannelIds: string[];
  moveMutedThreshold: number;
  moveListeningThreshold: number;
}
