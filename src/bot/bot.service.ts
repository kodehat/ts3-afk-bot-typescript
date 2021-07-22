import { injectable } from 'tsyringe';
import { ConfigService } from '../config';
import { LogService } from '../log';
import { ClientType, TeamSpeak, TeamSpeakClient, TextMessageTargetMode } from 'ts3-nodejs-library';
import { millisToTime } from '../util/time.util';

@injectable()
export class BotService {
  private _teamspeak?: TeamSpeak;
  private _idleCheckIntervalTimer?: ReturnType<typeof setInterval>;

  constructor(private configService: ConfigService, private log: LogService) {}

  async connect(): Promise<void> {
    if (this._teamspeak) {
      return;
    }

    this.log.info(`Connecting to ${this.configService.config.host}:${this.configService.config.port}...`);

    this._teamspeak = await TeamSpeak.connect({
      host: this.configService.config.host,
      queryport: this.configService.config.port,
      username: this.configService.config.user,
      password: this.configService.config.password,
      nickname: this.configService.config.nickname,
    });
    await this._teamspeak.useBySid(String(this.configService.config.serverId));
    await this._teamspeak.clientUpdate({ clientNickname: this.configService.config.nickname });

    process.on('SIGINT', () => this.disconnect());
  }

  private disconnect(): void {
    if (!this._teamspeak) {
      return;
    }
    if (this._idleCheckIntervalTimer) {
      clearInterval(this._idleCheckIntervalTimer);
    }
    this.log.info('Closing connection...');
    this._teamspeak.forceQuit();
    this.log.info('Closed!');
  }

  async startIdleCheck(): Promise<void> {
    if (this._idleCheckIntervalTimer) {
      return;
    }
    this.log.info('Starting idle check.');
    await this.idleCheck(); // Running once right away as otherwise waiting for delay for first run.
    this._idleCheckIntervalTimer = setInterval(
      async () => this.idleCheck(),
      this.configService.config.checkPeriod * 1000,
    );
  }

  async idleCheck(): Promise<void> {
    this.log.debug('Running idle check now.');
    const possibleClients = (await this._teamspeak?.clientList({ clientType: ClientType.Regular })) || [];
    const clientsToMove = possibleClients.filter(
      (client) =>
        this.isNotInAfkChannel(client) && (this.isClientIdleAndMuted(client) || this.isClientIdleAndListening(client)),
    );
    for (const client of clientsToMove) {
      this.log.info(
        `Client '${client.nickname}' is idling for ${millisToTime(client.idleTime)}. Moving it to AFK channel!`,
      );
      const currentChannel: string = client.cid;
      const afkChannel = await this._teamspeak?.getChannelById(String(this.configService.config.afkChannelId));
      if (afkChannel) {
        this._teamspeak?.clientMove(client, afkChannel);
        this._teamspeak?.sendTextMessage(
          client,
          TextMessageTargetMode.CLIENT,
          `You have been moved, because you're idling for ${millisToTime(client.idleTime)}.`,
        );
        this._teamspeak?.sendTextMessage(
          currentChannel,
          TextMessageTargetMode.CHANNEL,
          `Client ${client.nickname} was moved, because he was idling too long (${millisToTime(client.idleTime)}).`,
        );
      }
    }
  }

  private isNotInAfkChannel(client: TeamSpeakClient): boolean {
    return client.cid !== String(this.configService.config.afkChannelId);
  }

  private isClientIdleAndMuted(client: TeamSpeakClient): boolean {
    const mutedThreshold = this.configService.config.moveMutedThreshold * 1000;
    this.log.debug(`Client ${client.nickname} is muted and idle for ${millisToTime(client.idleTime)}.`);
    return client.idleTime > mutedThreshold && (client.inputMuted || client.outputMuted);
  }

  private isClientIdleAndListening(client: TeamSpeakClient): boolean {
    const listeningThreshold = this.configService.config.moveMutedThreshold * 1000;
    this.log.debug(`Client ${client.nickname} is listening and idle for ${millisToTime(client.idleTime)}.`);
    return client.idleTime > listeningThreshold && !client.inputMuted && !client.outputMuted;
  }
}
