# winston-tcp-graylog

```
yarn add winston-tcp-graylog winston
```

A [graylog](http://graylog.org) transport for [winston@2](https://github.com/flatiron/winston) based on the [gelf-pro@1](https://github.com/kkamkou/node-gelf-pro) library. Supports TCP and UPD protocol.

### Important

I'm sorry for not paying any attention to this repository for a long time.
All the vulnerable packages including `gelf-pro` have been upgraded in `winston-tcp-graylog@1.0.14`.
`winston-tcp-graylog@1.0.13` has been deprecated.

### Example

```js
'use strict'

import winston from 'winston'
import 'winston-tcp-graylog'

const options = {
  gelfPro: {
    adapterName: 'tcp',
    adapterOptions: {
      host: '127.0.0.1',
      port: 12201
    }
  }
}

const wGraylog = new winston.transports.TcpGraylog(options)
const wConsole = new winston.transports.Console()

const logger = new winston.Logger({
  transports: [wGraylog, wConsole]
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
logger.warn('%j - %j - %s - %s', [1, 2, 3], { 3: 4 }, /567/, new Error('890'))
logger.error('some formatted message\n\t some: 123\n\t foo: 345\n\t bar: 678')
logger.info('123', { meta: 345 })
```

### Config

* `name`:  Transport name
* `level`: Level of messages this transport should log. (default: info)
* `silent`: Boolean flag indicating whether to suppress output. (default: false)
* `handleExceptions`: Boolean flag, whenever to handle uncaught exceptions. (default: false)
* `humanReadableUnhandledException`: Option to get more readable exceptions.
* `formatter`: See [winston-doc](https://github.com/winstonjs/winston/blob/master/README.md#custom-log-format)
* `gelfPro`: See [gelfPro-doc](https://github.com/kkamkou/node-gelf-pro) or [my-jjv-schema](https://github.com/nskazki/winston-tcp-graylog/blob/master/src%2Fvalidate.es6#L59)
* `baseMsg`: Object containing the default message fields.
* `levelMap`: Object for extending the base [levelMap](https://github.com/nskazki/winston-tcp-graylog/blob/master/src%2Findex.es6#L55)

### DefaultConfig

```js
{
    name: 'tcpGraylog',
    silent: false,
    level: 'info',
    handleExceptions: false,
    humanReadableUnhandledException: false,
    formatter: v => v,
    baseMsg: {
        version: '1.1',    // GELF spec version
        appVersion: '...', // package.version || unknown version
        facility: '...',   // package.name || app-dir
        host: '...'        // hostname -f || os.hostname()
    },
    gelfPro: {
        adapterName: 'udp',
        adapterOptions: {
            protocol: 'udp4',
            host: '127.0.0.1',
            port: 12201
        },
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
```
