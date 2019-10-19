'use strict'

import { find as pkFind } from 'pkginfo'
import { isString, trim, isNull, chain } from 'lodash'
import { execSync } from 'child_process'
import { hostname } from 'os'
import { dirname, basename } from 'path'

export function projectVersion() {
  try {
    const { version } = projectRootPackage()
    if (isString(version) && (trim(version).length > 0)) {
      return trim(version)
    } else {
      throw new Error('empty projectVersion')
    }
  } catch (_err) {
    return 'unknown version'
  }
}

export function projectHost() {
  try {
    const params = { encoding: 'utf8', timeout: 1e3 }
    const cmd = 'hostname -f'
    return execSync(cmd, params).replace(/[\n|\r]/g, '')
  } catch (_err) {
    return hostname()
  }
}

export function projectRootModule() {
  return (function _(module) {
    return isNull(module.parent)
      ? module
      : _(module.parent)
  }(module))
}

export function projectRootPackage() {
  return chain(module)
    .thru(projectRootModule)
    .thru(pkFind)
    .thru(require)
    .value()
}

export function projectName() {
  try {
    const { name } = projectRootPackage()
    if (isString(name) && (trim(name).length > 0)) {
      return trim(name)
    } else {
      throw new Error('empty projectName')
    }
  } catch (_err) {
    return projectDir()
  }
}

export function projectDir() {
  try {
    const cwd = process.cwd()
    const { filename } = projectRootModule()
    return `${basename(cwd)}${dirname(filename).replace(cwd, '')}`
  } catch (_err) {
    return `[REPL on ${projectHost()}]`
  }
}
