import * as dotenv from 'dotenv';
import * as joi from 'joi';
import { Config } from './config.types';
import { singleton } from 'tsyringe';
import { LogService } from '../log';

@singleton()
export class ConfigService {
  private readonly _config: Config;

  constructor(private log: LogService) {
    this._config = this._loadConfig();
  }

  private _loadConfig(): Config {
    this.log.info('Loading and validating configuration...');
    const result = dotenv.config();

    if (result.error) {
      this.log.error('Unable to load configuration: ', result.error);
      process.exit(1);
    }

    const configSchema = joi
      .object()
      .keys({
        HOST: joi
          .alternatives()
          .try(joi.string().hostname(), joi.string().ip({ version: 'ipv4' }))
          .required(),
        PORT: joi.number().positive().required(),
        USER: joi.string().required(),
        PASSWORD: joi.string().required(),
        NICKNAME: joi.string().required(),
        SERVER_ID: joi.number().positive().required(),
        CHECK_PERIOD: joi.number().positive().required(),
        AFK_CHANNEL_ID: joi.number().positive().required(),
        EXCLUDE_CHANNEL_IDS: joi.alternatives().try(joi.array().items(joi.string()), joi.string()),
        MOVE_MUTED_THRESHOLD: joi.number().positive().required(),
        MOVE_LISTENING_THRESHOLD: joi.number().positive().required(),
      })
      .unknown();

    const { value: configVars, error } = configSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

    if (error) {
      this.log.error('Config validation error: ', error);
      process.exit(2);
    }

    this.log.info('Configuration successfully loaded and validated.');

    const excludeChannelIds = ConfigService.loadExcludeChannelIds(configVars);
    this.log.debug(`Excluded channel IDs: ${excludeChannelIds.join(', ')}`);

    return {
      host: configVars.HOST,
      port: configVars.PORT,
      user: configVars.USER,
      password: configVars.PASSWORD,
      nickname: configVars.NICKNAME,
      serverId: configVars.SERVER_ID,
      checkPeriod: configVars.CHECK_PERIOD,
      afkChannelId: configVars.AFK_CHANNEL_ID,
      excludeChannelIds,
      moveMutedThreshold: configVars.MOVE_MUTED_THRESHOLD,
      moveListeningThreshold: configVars.MOVE_LISTENING_THRESHOLD,
    };
  }

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  private static loadExcludeChannelIds(configVars: any): string[] {
    const excludeChannelIds: string = configVars.EXCLUDE_CHANNEL_IDS;
    if (!excludeChannelIds) {
      return [];
    }
    return excludeChannelIds.split(',');
  }

  get config(): Config {
    return this._config;
  }
}
