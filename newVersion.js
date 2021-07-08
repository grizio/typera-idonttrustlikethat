const childProcess = require("child_process")
const path = require("path")
const fs = require("fs")

const updateModifier = process.argv[2]
if (!["major", "minor", "patch"].includes(updateModifier)) {
  console.info("Usage: npm run new-version (major | minor | patch)")
  process.exit(0)
}

execCommand(`npm version ${updateModifier} --workspaces`)

const commonVersion = getVersion("packages/typera-idonttrustlikethat-common/package.json")
updateCommonVersion("packages/typera-idonttrustlikethat-express/package.json", commonVersion)
updateCommonVersion("packages/typera-idonttrustlikethat-koa/package.json", commonVersion)
updateVersion("package.json", commonVersion)

execCommand("npm install")
execCommand("npm run build")
execCommand("npm run test")
execCommand("git add **/package*.json package*.json")
execCommand(`git commit -m "${commonVersion}"`)
execCommand(`git tag -a ${commonVersion} -m "${commonVersion}"`)
execCommand('git push --follow-tags')

function getVersion(file) {
  const rawFile = fs.readFileSync(path.join(__dirname, file))
  const json = JSON.parse(rawFile)
  return json.version
}

function updateVersion(file, version) {
  const filePath = path.join(__dirname, file)

  const rawFile = fs.readFileSync(filePath)
  const json = JSON.parse(rawFile)

  json.version = version
  const resultingJson = JSON.stringify(json, null, 2)
  fs.writeFileSync(filePath, resultingJson)
}

function updateCommonVersion(file, version) {
  const filePath = path.join(__dirname, file)

  const rawFile = fs.readFileSync(filePath)
  const json = JSON.parse(rawFile)

  if (json.dependencies["typera-idonttrustlikethat-common"]) {
    json.dependencies["typera-idonttrustlikethat-common"] = version
    const resultingJson = JSON.stringify(json, null, 2)
    fs.writeFileSync(filePath, resultingJson)
  }
}

function execCommand(command) {
  console.info(command)
  childProcess.execSync(command, { cwd: path.join(__dirname), stdio: "inherit" })
}
