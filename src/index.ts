import 'reflect-metadata';
import { container } from 'tsyringe';
import { BotService } from './bot/bot.service';
import { LogService } from './log';

const log = container.resolve(LogService);

async function main(): Promise<void> {
  const bot = container.resolve(BotService);
  await bot.connect();
  await bot.startIdleCheck();
}

main().catch((e) => log.error('An unexpected error occurred: ', e));
