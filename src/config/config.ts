import * as dotenv from 'dotenv';
import * as joi from 'joi';
import { Config } from './config.types';

export function loadConfig(): Config {
  const result = dotenv.config();

  if (result.error) {
    throw result.error;
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
    })
    .unknown();

  const { value: configVars, error } = configSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return {
    host: configVars.HOST,
    port: configVars.PORT,
    user: configVars.USER,
    password: configVars.PASSWORD,
    nickname: configVars.NICKNAME,
    serverId: configVars.SERVER_ID,
    checkPeriod: configVars.CHECK_PERIOD,
    afkChannelId: configVars.AFK_CHANNEL_ID,
  };
}
