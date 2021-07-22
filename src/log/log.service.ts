import chalk from 'chalk';
import { DateTimeFormatter, LocalTime } from '@js-joda/core';
import { singleton } from 'tsyringe';

const log = console.log;

@singleton()
export class LogService {
  logTimeFormatter: DateTimeFormatter;

  constructor() {
    this.logTimeFormatter = DateTimeFormatter.ofPattern('HH:mm:ss');
  }

  private doLog(tag: string, msg: string): void {
    log(`${tag} ${chalk.gray(LocalTime.now().format(this.logTimeFormatter).toString())} ${msg}`);
  }

  debug(msg: string): void {
    if (process.env.DEBUG === 'true') {
      this.doLog(chalk.blue('[DEBUG]'), msg);
    }
  }

  info(msg: string): void {
    this.doLog(chalk.green('[INFO]'), msg);
  }

  warn(msg: string): void {
    this.doLog(chalk.yellow('[WARN]'), msg);
  }

  error(msg: string, error?: Error): void {
    this.doLog(chalk.red('[ERROR]'), `${msg}${error ? chalk.bgRed(error?.message) : ''}`);
  }
}
