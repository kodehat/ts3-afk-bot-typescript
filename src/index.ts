import * as log from './log';
import { Config, loadConfig } from './config';
import { TeamSpeak } from 'ts3-nodejs-library';
import { Instant } from '@js-joda/core';

async function main(): Promise<void> {
  log.info('Loading and validating configuration...');
  let config: Config;
  try {
    config = loadConfig();
  } catch (e) {
    log.error('Unable to load configuration: ', e);
    process.exit(1);
  }
  log.info('Configuration successfully loaded and validated.');
  log.info(`Connecting to ${config.host}:${config.port}...`);

  let teamspeak: TeamSpeak;
  try {
    teamspeak = await TeamSpeak.connect({
      host: config.host,
      queryport: config.port,
      username: config.user,
      password: config.password,
      nickname: config.nickname,
    });
  } catch (e) {
    log.error('Unable to connect to server: ', e);
    process.exit(2);
  }
  process.on('SIGINT', () => {
    log.info('Closing connection...');
    teamspeak.forceQuit();
    log.info('Closed!');
  });
  await teamspeak.useBySid('1');
  const clients = await teamspeak.clientList();
  clients.forEach((client) => {
    const lastConnected = Instant.ofEpochSecond(client.lastconnected);
    log.info(`Client named '${client.nickname}/${lastConnected.toString()}'`);
  });
}

main().catch((e) => log.error('An unexpected error occurred: ', e));
