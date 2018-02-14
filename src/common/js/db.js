const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const db = new sqlite3.Database(path.resolve(__dirname, 'db.db'))
const dbDDL = require('./db-ddl')
db.run(dbDDL.ddl)
/*
db.all('select * from t_article ', function(err, res) {
  if (!err) { console.log(res) } else { console.log(err) }
})
*/
db.each('select count(1) from t_article', (error, row) => {
  console.log(row)
  console.log(error)
})
db.on('error', error => {
  console.log(error)
})
db.updateTime = function (listurl,date) {
  console.log(date)
}
module.exports = db
