import { injectable } from 'tsyringe';
import { ConfigService } from '../config';
import { LogService } from '../log';
import { ClientType, TeamSpeak, TeamSpeakClient, TextMessageTargetMode } from 'ts3-nodejs-library';
import { millisToTime } from '../util/time.util';

@injectable()
export class BotService {
  private _teamspeak?: TeamSpeak;
  private _isRunIdleCheckTask = false;

  constructor(private configService: ConfigService, private log: LogService) {}

  async connect(): Promise<void> {
    if (this._teamspeak) {
      return;
    }

    this.log.info(
      `Connecting to ${this.configService.config.host}:${this.configService.config.port} ` +
        `(via ${this.configService.config.protocol.toString().toUpperCase()}).`,
    );

    this._teamspeak = await TeamSpeak.connect({
      host: this.configService.config.host,
      queryport: this.configService.config.port,
      protocol: this.configService.config.protocol,
      username: this.configService.config.user,
      password: this.configService.config.password,
      nickname: this.configService.config.nickname,
    });
    await this._teamspeak.useBySid(String(this.configService.config.serverId));
    await this._teamspeak.clientUpdate({ clientNickname: this.configService.config.nickname });

    process.on('SIGINT', () => {
      this.disconnect();
      process.exit(0);
    });
  }

  private disconnect(): void {
    if (!this._teamspeak) {
      return;
    }
    this._isRunIdleCheckTask = false;
    this.log.info('Closing connection.');
    this._teamspeak?.forceQuit();
    this.log.info('Closed!');
  }

  async startIdleCheck(): Promise<void> {
    if (this._isRunIdleCheckTask) {
      return;
    }
    this._isRunIdleCheckTask = true;
    this.log.info('Starting idle check.');
    await this.idleCheck(); // Running once right away as otherwise waiting for delay for first run.
  }

  async idleCheck(): Promise<void> {
    this.log.debug('Running idle check now.');
    const possibleClients = (await this._teamspeak?.clientList({ clientType: ClientType.Regular })) || [];
    const clientsToMove = possibleClients.filter(
      (client) =>
        this.isNotInExcludedChannel(client) &&
        (this.isClientIdleAndMuted(client) || this.isClientIdleAndListening(client)),
    );
    for (const client of clientsToMove) {
      this.log.info(
        `Client '${client.nickname}' is idling for ${millisToTime(client.idleTime)}. Moving it to AFK channel!`,
      );
      const currentChannel: string = client.cid;
      const afkChannel = await this._teamspeak?.getChannelById(String(this.configService.config.afkChannelId));
      if (afkChannel) {
        await this._teamspeak?.clientMove(client, afkChannel);
        await this._teamspeak?.sendTextMessage(
          client,
          TextMessageTargetMode.CLIENT,
          `You have been moved, because you're idling for ${millisToTime(client.idleTime)}.`,
        );
        await this._teamspeak?.sendChannelMessage(
          currentChannel,
          `Client ${client.nickname} was moved, because he was idling too long (${millisToTime(client.idleTime)}).`,
        );
      }
    }
    if (this._isRunIdleCheckTask) {
      setTimeout(async () => this.idleCheck(), this.configService.config.checkPeriod * 1000);
    }
  }

  private isNotInExcludedChannel(client: TeamSpeakClient): boolean {
    const excludedChannelIds: string[] = [...this.configService.config.excludeChannelIds];
    excludedChannelIds.push(String(this.configService.config.afkChannelId));
    return excludedChannelIds.indexOf(client.cid) === -1;
  }

  private isClientIdleAndMuted(client: TeamSpeakClient): boolean {
    const mutedThreshold = this.configService.config.moveMutedThreshold * 1000;
    const isMute = client.inputMuted || client.outputMuted;
    if (isMute) {
      this.log.debug(`Client ${client.nickname} is muted and idle for ${millisToTime(client.idleTime)}.`);
    }
    return client.idleTime > mutedThreshold && isMute;
  }

  private isClientIdleAndListening(client: TeamSpeakClient): boolean {
    const listeningThreshold = this.configService.config.moveListeningThreshold * 1000;
    const isListening = !client.inputMuted && !client.outputMuted;
    if (isListening) {
      this.log.debug(`Client ${client.nickname} is listening and idle for ${millisToTime(client.idleTime)}.`);
    }
    return client.idleTime > listeningThreshold && isListening;
  }
}
