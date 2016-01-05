'use strict'

import { debugEvents, debugMethods } from 'simple-debugger'
import { extend, trim, isNumber,
  mapValues, isString, isRegExp,
  isFunction, defaults, isObject } from 'lodash'
import { projectVersion, projectName, projectHost } from './projectInfo'
import { inspect } from 'util'
import P from 'bluebird'
import Debug from 'debug'
import winston from 'winston'
import moment from 'moment'
import clearRequire from 'clear-require'
import validate from './validate'

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

    defaults(this, config, {
      name: 'tcpGraylog',
      silent: false,
      level: 'info',
      handleExceptions: false,
      humanReadableUnhandledException: false,
      formatter: v => v
    })

    this.log = this.log.bind(this)
  }

  _setupConfig(config) {
    let err = validate('config', config)
    if (err) throw new Error(`BellmanGraylog#new problem: config has wrong format!\
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
    this._levelMap = extend(myMap, this._config.levelMap)

    wtgDebug('levelMap: %j', this._levelMap)
    return this
  }

  _setupBaseMsg() {
    let appVersion = projectVersion()
    let facility   = projectName()
    let host       = projectHost()
    let humanTime  = { toJSON: () => moment().format('DD/MM HH:mm:ss (Z)') }

    let myBaseMsg = { appVersion, facility, host, humanTime }
    this._baseMsg = extend(myBaseMsg, this._config.baseMsg)

    wtgDebug('baseMsg: %j', this._baseMsg)
    return this
  }

  _setupGelf() {
    clearRequire('gelf-pro')
    this._gelf = require('gelf-pro')
    this._gelf.setConfig(this._config.gelfPro)

    wtgDebug('gelfPro: %j', this._config.gelfPro)
    return this
  }

  _normalizeMeta(rawMeta) {
    return mapValues(rawMeta, v => {
      if (isObject(v) && v.message && v.stack) {
        return { message: v.message, stack: v.stack }
      } else if (isFunction(v) || isRegExp(v)) {
        return v.toString()
      } else if (isObject(v)) {
        return this._normalizeMeta(v)
      } else {
        return v
      }
    })
  }

  log(humanLevel, fmtMsg, rawMeta, callback) {
    // prepare resMsg
    let level = this._levelMap[humanLevel]
    if (!isNumber(level)) {
      let err = new Error(`BellmanGraylog#handler problem: level not found! \
        \n\t humanLevel: %{humanLevel}`)
      wtgDebug(err)
      this.emit('error', err)
      return callback(err)
    }

    let short_message = fmtMsg
      .split(/[\r\t\n]/)
      .filter(v => isString(v) && (trim(v).length > 0))[0]

    if (short_message.length === 0) {
      let res = `BellmanGraylog#handler skip: catch empty message: \
        \n\t fmtMsg: ${fmtMsg} \
        \n\t rawMeta: ${inspect(rawMeta)}`
      wtgDebug(res)
      this.emit('skip', res)
      return callback(null, res)
    }

    let msgMeta = this._normalizeMeta(rawMeta)
    let full_message = fmtMsg
    let resMsg = extend({}, this._baseMsg, msgMeta,
      { level, humanLevel, short_message, full_message })

    // prepare and send gelfMsg
    let gelfMsg = this._gelf.getStringFromObject(resMsg)
    return P
      .fromNode(cb => this._gelf.send(gelfMsg, cb))
      .then(res => {
        wtgDebug('send', gelfMsg)
        this.emit('send', gelfMsg, res)
        callback(null, gelfMsg, res)
      })
      .catch((rawErr = {}) => {
        let message = `BellmanGraylog#handler problem: gelf-pro return error! \
          \n\t err: ${rawErr.message || inspect(rawErr)}`
        let err = rawErr.message
          ? extend(rawErr, { message })
          : new Error(message)
        wtgDebug(err)
        this.emit('error', err)
        callback(err)
      })
  }
}

export default WinstonTcpGraylog
winston.transports.TcpGraylog = WinstonTcpGraylog