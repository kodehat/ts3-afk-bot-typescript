import { TeamSpeak } from 'ts3-nodejs-library';
import QueryProtocol = TeamSpeak.QueryProtocol;

export interface Config {
  host: string;
  port: number;
  protocol: QueryProtocol;
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
