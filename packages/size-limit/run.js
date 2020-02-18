let readPkgUp = require('read-pkg-up')

let SizeLimitError = require('./size-limit-error')
let createReporter = require('./create-reporter')
let loadPlugins = require('./load-plugins')
let createHelp = require('./create-help')
let getConfig = require('./get-config')
let parseArgs = require('./parse-args')
let debug = require('./debug')
let calc = require('./calc')
let startWatch = require('./start-watch')

module.exports = async process => {
  function hasArg (arg) {
    return process.argv.some(i => i === arg)
  }

  let reporter = createReporter(process, hasArg('--json'))
  let help = createHelp(process)
  let config, args

  function handleError (error, argv, configData) {
    debug.error(process, argv, configData)
    reporter.error(error)
    process.exit(1)
  }

  async function run () {
    let pkg = await readPkgUp({ cwd: process.cwd() })
    let plugins = loadPlugins(pkg)

    if (hasArg('--help')) {
      return help.showHelp(plugins)
    }

    if (!pkg || !pkg.packageJson) {
      throw new SizeLimitError('noPackage')
    }

    args = parseArgs(plugins, process.argv)

    if (plugins.isEmpty) {
      help.showMigrationGuide(pkg)
      return process.exit(1)
    }

    config = await getConfig(plugins, process, args, pkg)

    await calc(plugins, config)

    debug.results(process, args, config)
    reporter.results(plugins, config)

    if (config.failed && !args.why) process.exit(1)
  }

  try {
    if (hasArg('--version')) {
      return help.showVersion()
    }

    await run()

    if (hasArg('--watch')) {
      startWatch(process.cwd(), async () => {
        try {
          await run()
        } catch (e) {
          handleError(e, args, config)
        }
      })
    }
  } catch (e) {
    handleError(e, args, config)
  }
}
