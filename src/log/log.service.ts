import { DateTimeFormatter, LocalDate, ZoneId } from '@js-joda/core';
import { singleton } from 'tsyringe';
import { ILogObject, Logger } from 'tslog';
import { appendFileSync } from 'fs';
import findRemoveSync from 'find-remove';

function logToFile(logObject: ILogObject) {
  const now = LocalDate.now(ZoneId.UTC);
  const path = `${process.cwd()}/logs/bot_${now.year()}-${now.month().value()}-${now.dayOfMonth()}.log`;
  appendFileSync(path, `${JSON.stringify(logObject)}\n`);
}

@singleton()
export class LogService {
  logTimeFormatter: DateTimeFormatter;
  log: Logger;

  constructor() {
    this.logTimeFormatter = DateTimeFormatter.ofPattern('HH:mm:ss');
    this.log = new Logger({
      displayFilePath: 'hidden',
      displayFunctionName: false,
      displayInstanceName: false,
    });
    this.log.attachTransport(
      {
        silly: logToFile,
        debug: logToFile,
        trace: logToFile,
        info: logToFile,
        warn: logToFile,
        error: logToFile,
        fatal: logToFile,
      },
      'debug',
    );
    setInterval(() => {
      this.log.info('Cleaning up old logs (older than seven days).');
      findRemoveSync(`${process.cwd()}/logs`, {
        age: { seconds: 60 * 60 * 24 * 7 },
        extensions: '.log',
      });
    }, 60 * 60 * 24);
  }

  // private doLog(tag: string, msg: string): void {
  //   log(`${tag} ${chalk.gray(LocalTime.now().format(this.logTimeFormatter).toString())} ${msg}`);
  // }

  debug(msg: string): void {
    if (process.env.DEBUG === 'true') {
      //this.doLog(chalk.blue('[DEBUG]'), msg);
      this.log.debug(msg);
    }
  }

  info(msg: string): void {
    //this.doLog(chalk.green('[INFO]'), msg);
    this.log.info(msg);
  }

  warn(msg: string): void {
    //this.doLog(chalk.yellow('[WARN]'), msg);
    this.log.warn(msg);
  }

  error(msg: string, error?: Error): void {
    //this.doLog(chalk.red('[ERROR]'), `${msg}${error ? chalk.bgRed(error?.message) : ''}`);
    this.log.error(msg, error);
  }
}
