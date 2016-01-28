'use strict'

import winston from 'winston'
import WinstonTcpGraylog from '../src'

var options = {
  name: 'tcpGraylog',
  silent: false,
  level: 'info',
  handleExceptions: false,
  humanReadableUnhandledException: false,
  formatter: v => v,
  gelfPro: {
    adapterName: 'tcp',
    adapterOptions: {
      host: '127.0.0.1',
      port: 12201
    }
  },
  levelMap: {
    emergency: 0,
    emerg: 0,
    alert: 1,
    critical: 2,
    crit: 2,
    error: 3,
    err: 3,
    warning: 4,
    warn: 4,
    notice: 5,
    note: 5,
    information: 6,
    info: 6,
    log: 6,
    debug: 7
  }
}

var wGraylog = new winston.transports.TcpGraylog(options)
var wConsole = new winston.transports.Console()

var logger = new winston.Logger({
  transports: [ wGraylog, wConsole ]
})

logger
  .on('error', err => {
    // internal winston problems
    console.error(' !error: ', err)
  })
  .on('logging', (transport, level, msg, meta) => {
    // each winston transports
    console.info(' !logging: ', transport.name, level, msg, meta)
  })

wGraylog
  .on('error', err => {
    // internal WinstonTcpGraylog problems
    console.error(' !wtg:error: ', err)
  })
  .on('send', (msg, res) => {
    // only WinstonTcpGraylog "logging"
    console.info(' !wtg:send: ', msg, res)
  })
  .on('skip', warn => {
    // only WinstonTcpGraylog "skiping"
    console.warn(' !wtg:skip: ', warn)
  })

logger.info('123', { meta: 123, foo: 345, bar: 689, some: false })
logger.warn('%j - %j - %s - %s', [1, 2, 3], { 1: 2 }, /123/, new Error('123'))
logger.error(`some formatter message \
  \n\t some: 123\
  \n\t foo: 123\
  \n\t bar: 345`)
logger.info('345', { meta: 345 })
