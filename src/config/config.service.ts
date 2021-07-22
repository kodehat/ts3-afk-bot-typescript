import * as dotenv from 'dotenv';
import * as joi from 'joi';
import { Config } from './config.types';
import { singleton } from 'tsyringe';
import { LogService } from '../log';
import { QueryProtocol } from 'ts3-nodejs-library';

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
        DEBUG: joi.boolean().required(),
        QUERY_HOST: joi
          .alternatives()
          .try(joi.string().hostname(), joi.string().ip({ version: 'ipv4' }))
          .required(),
        QUERY_PORT: joi.number().positive().required(),
        QUERY_PROTOCOL: joi.string().valid(QueryProtocol.RAW.toString(), QueryProtocol.SSH.toString()).required(),
        QUERY_USER: joi.string().required(),
        QUERY_PASSWORD: joi.string().required(),
        QUERY_NICKNAME: joi.string().required(),
        QUERY_SERVER_ID: joi.number().positive().required(),
        QUERY_CHECK_PERIOD: joi.number().positive().required(),
        QUERY_AFK_CHANNEL_ID: joi.number().positive().required(),
        QUERY_EXCLUDE_CHANNEL_IDS: joi.alternatives().try(joi.array().items(joi.string()), joi.string()),
        QUERY_MOVE_MUTED_THRESHOLD: joi.number().positive().required(),
        QUERY_MOVE_LISTENING_THRESHOLD: joi.number().positive().required(),
      })
      .unknown();

    const { value: configVars, error } = configSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

    if (error) {
      this.log.error('Config validation error: ', error);
      process.exit(2);
    }

    this.log.info('Configuration successfully loaded and validated.');

    const excludeChannelIds = ConfigService.loadExcludeChannelIds(configVars.QUERY_EXCLUDE_CHANNEL_IDS);
    this.log.debug(`Excluded channel IDs: ${excludeChannelIds.join(', ')}`);

    return {
      host: configVars.QUERY_HOST,
      port: configVars.QUERY_PORT,
      protocol: configVars.QUERY_PROTOCOL,
      user: configVars.QUERY_USER,
      password: configVars.QUERY_PASSWORD,
      nickname: configVars.QUERY_NICKNAME,
      serverId: configVars.QUERY_SERVER_ID,
      checkPeriod: configVars.QUERY_CHECK_PERIOD,
      afkChannelId: configVars.QUERY_AFK_CHANNEL_ID,
      excludeChannelIds,
      moveMutedThreshold: configVars.QUERY_MOVE_MUTED_THRESHOLD,
      moveListeningThreshold: configVars.QUERY_MOVE_LISTENING_THRESHOLD,
    };
  }

  private static loadExcludeChannelIds(excludeChannelIds: string): string[] {
    if (!excludeChannelIds) {
      return [];
    }
    return excludeChannelIds.split(',');
  }

  get config(): Config {
    return this._config;
  }
}
