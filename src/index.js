const { debugEvents, debugMethods } = require('simple-debugger')
const { extend, trim, merge, map, mapValues,
  isArray, isNumber, isString, isRegExp,
  isFunction, isObject, isBoolean }  =  require('lodash')
const { projectVersion, projectName, projectHost }  =  require('./projectInfo')
const { inspect }  =  require('util')
const Debug  =  require('debug')
const winston  =  require('winston')
const moment  =  require('moment')
const clearRequire  =  require('clear-require')
const validate  =  require('./validate')
const promisifyAll = require('util-promisifyall');

let wtgDebug = new Debug('libs-winston-tcp-graylog')

class WinstonTcpGraylog extends winston.Transport {
  constructor(config = {}) {
    super()

    debugEvents(this)
    debugMethods(this, [ 'on', 'once', 'emit',
      'addListener', 'removeListener' ])

    this._setupConfig(config)
    this._setupLevelMap()
    this._setupBaseMsg()
    this._setupGelf()

    let baseConfig = {
      name: 'tcpGraylog',
      silent: false,
      level: 'info',
      handleExceptions: false,
      humanReadableUnhandledException: false,
      formatter: v => v
    }
    merge(this, baseConfig, this._config)

    this.log = this.log.bind(this)
  }

  _setupConfig(config) {
    let err = validate('config', config)
    if (err) throw new Error(`WinstonTcpGraylog#new problem: config has wrong format!\
      \n\t config: ${inspect(config)}\
      \n\t err: ${inspect(err)}`)
    this._config = config

    wtgDebug('config: %j', config)
    return this
  }

  _setupLevelMap() {
    let myMap = {
      'emergency': 0,
      'emerg': 0,
      'alert': 1,
      'critical': 2,
      'crit': 2,
      'error': 3,
      'err': 3,
      'warning': 4,
      'warn': 4,
      'notice': 5,
      'note': 5,
      'information': 6,
      'info': 6,
      'log': 6,
      'debug': 7
    }
    this._levelMap = extend(myMap, (this._config.levelMap || this._config.levels))

    wtgDebug('levelMap: %j', this._levelMap)
    return this
  }

  _setupBaseMsg() {
    let appVersion = projectVersion()
    let facility   = projectName()
    let host       = projectHost()

    let myBaseMsg = { appVersion, facility, host }
    this._baseMsg = extend(myBaseMsg, this._config.baseMsg)

    wtgDebug('baseMsg: %j', this._baseMsg)
    return this
  }

  _setupGelf() {
    clearRequire('gelf-pro')
    this._gelf = promisifyAll(require('gelf-pro'))
    this._gelf.setConfig(this._config.gelfPro)

    wtgDebug('gelfPro: %j', this._config.gelfPro)
    return this
  }

  _normalizeMeta(object) {
    let myMap = isArray(object)
      ? map
      : mapValues

    return myMap(object, v => {
      if (isObject(v) && v.message && v.stack) {
        return { message: v.message, stack: v.stack }
      } else if (isFunction(v) || isRegExp(v) || isBoolean(v)) {
        return v.toString()
      } else if (isObject(v)) {
        return this._normalizeMeta(v)
      } else {
        return v
      }
    })
  }

  log(humanLevel, fmtMsg, rawMeta, callback) {
    if (this.silent) {
      let res = `WinstonTcpGraylog#handler skip: module was silent!`
      wtgDebug(res)
      this.emit('skip', res)
      return callback(null, res)
    }

    // prepare resMsg
    let level = this._levelMap[humanLevel]
    if (!isNumber(level)) {
      let err = new Error(`WinstonTcpGraylog#handler problem: level not found! \
        \n\t humanLevel: ${humanLevel}`)
      wtgDebug(err)
      this.emit('error', err)
      return callback(err)
    }

    let short_message = fmtMsg
      .split(/[\r\t\n]/)
      .filter(v => isString(v) && (trim(v).length > 0))[0]

    if (!short_message || short_message.length === 0) {
      let res = `WinstonTcpGraylog#handler skip: catch empty message: \
        \n\t fmtMsg: ${fmtMsg} \
        \n\t rawMeta: ${inspect(rawMeta)}`
      wtgDebug(res)
      this.emit('skip', res)
      return callback(null, res)
    }

    let full_message = fmtMsg
    let humanTime  = moment().format('DD/MM HH:mm:ss (Z)')
    let curMsg = { level, humanLevel, short_message, full_message, humanTime }
    let resMsg = this._normalizeMeta(extend({}, this._baseMsg, rawMeta, curMsg))

    // prepare and send gelfMsg
    let gelfMsg = this._gelf.getStringFromObject(resMsg)

    this._gelf.sendAsync(gelfMsg)
      .then(res => {
        wtgDebug('send', gelfMsg)
        this.emit('send', gelfMsg, res)
        callback(null, gelfMsg, res)
      })
      .catch((rawErr = {}) => {
        let message = `WinstonTcpGraylog#handler problem: gelf-pro return error! \
          \n\t err: ${rawErr.message || inspect(rawErr)}`
        console.log(rawErr.stack);
        let err = rawErr.message
          ? extend(rawErr, { message })
          : new Error(message)
        wtgDebug(err)
        this.emit('error', err)
        callback(err)
      })
  }
}

module.exports = WinstonTcpGraylog
winston.transports.TcpGraylog = WinstonTcpGraylog
