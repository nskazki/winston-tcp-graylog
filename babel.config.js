'use strict'

module.exports = {
  presets: [['@babel/preset-env', {
    targets: {
      node: 8
    }
  }]],
  plugins: [['add-module-exports', {
    addDefaultProperty: true
  }]]
}
