import chalk from 'chalk';
import { DateTimeFormatter, LocalTime } from '@js-joda/core';

const log = console.log;
const timeFormatter = DateTimeFormatter.ofPattern('HH:mm:ss');

function doLog(tag: string, msg: string): void {
  log(`${tag} ${chalk.gray(LocalTime.now().format(timeFormatter).toString())} ${msg}`);
}

export function info(msg: string): void {
  doLog(chalk.green('[INFO]'), msg);
}

export function warn(msg: string): void {
  doLog(chalk.yellow('[WARN]'), msg);
}

export function error(msg: string, error?: Error): void {
  doLog(chalk.red('[ERROR]'), `${msg}${error ? chalk.bgRed(error?.message) : ''}`);
}
