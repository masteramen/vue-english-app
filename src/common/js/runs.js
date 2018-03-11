
const dataManager = require('./data-manager')

export async function runAll() {
  await dataManager.runJobs()
  console.log('donw run jobs')
}

