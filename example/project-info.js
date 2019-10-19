'use strict'

import {
  projectDir,
  projectName,
  projectHost,
  projectVersion,
  projectRootModule,
  projectRootPackage } from '../src/projectInfo'

console.info({
  projectDir: projectDir(),
  projectName: projectName(),
  projectHost: projectHost(),
  projectVersion: projectVersion(),
  projectRootModule: projectRootModule(),
  projectRootPackage: projectRootPackage()
})
