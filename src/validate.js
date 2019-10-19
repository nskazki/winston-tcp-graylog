'use strict'

import { isFunction } from 'lodash'
import JJV from 'jjv'

const jjv = new JJV()
export default jjv.validate.bind(jjv)

/*
  adapterOptions:
    - tcp: https://nodejs.org/dist/latest-v5.x/docs/api/net.html#net_socket_connect_options_connectlistener
    - upd: https://nodejs.org/api/dgram.html#dgram_socket_bind_options_callback
           (but really use: 'protocol', 'port', 'host' as 'address')
  levelMap:
    https://en.wikipedia.org/wiki/Syslog#Severity_level
*/

jjv.addType('function', v => isFunction(v))
jjv.addSchema('config', {
  type: 'object',
  example: {
    name: 'tcpGraylog',
    silent: false,
    level: 'info',
    handleExceptions: false,
    humanReadableUnhandledException: false,
    formatter: v => v,
    gelfPro: {
      host: 'localhost',
      port: 12201
    },
    baseMsg: {
      autor: 'nskazki@gmail.com'
    },
    levelMap: {
      panic: 3, // as error
      log:   7  // as debug
    }
  },
  properties: {
    name: {
      type: 'string'
    },
    silent: {
      type: 'boolean'
    },
    level: {
      type: 'string'
    },
    handleExceptions: {
      type: 'boolean'
    },
    humanReadableUnhandledException: {
      type: 'boolean'
    },
    formatter: {
      type: 'function'
    },
    gelfPro: {
      type: 'object',
      properties: {
        adapterName: {
          type: 'string',
          enum: ['udp', 'tcp']
        },
        adapterOptions: {
          type: 'object',
          properties: {
            port: { type: 'integer' },
            host: { type: 'string' },
            localAddress: { type: 'string' },
            localPort: { type: 'integer' },
            family: { type: 'integer' },
            lookup: { type: 'function' },
            protocol: { type: 'string' }
          }
        }
      }
    },
    baseMsg: {
      type: 'object'
    },
    levelMap: {
      type: 'object',
      patternProperties: {
        '.': { type: 'integer' }
      }
    }
  }
})
