const ddl = `
CREATE TABLE IF NOT EXISTS t_article(
   ID INTEGER PRIMARY KEY     AUTOINCREMENT,
   title           TEXT NOT NULL,
   title_CN         TEXT,
   CONTENT         TEXT,
   CATEGORY        TEXT,
   thumb        TEXT,
   audio        TEXT,
   TOTAL        ,
   VIDEO_URL        TEXT,
   LRC_OK        TEXT,
   DURATION        TEXT,
   ORG_SITE       TEXT,
   link        TEXT UNIQUE NOT NULL,
   AUTHOR        TEXT ,
   pubDate  TEXT,
   STATUS  TEXT DEFAULT 'A',
   feedId    TEXT,
   LAST_DOWNLOAD_DATE TEXT
)
`
const dictDDL = `
CREATE TABLE IF NOT EXISTS T_DICT(
   ID INTEGER PRIMARY KEY     AUTOINCREMENT,
   QTEXT           TEXT UNIQUE NOT NULL,
   RESULT         TEXT,
   DETAIL     TEXT,
   ADD_DATE     TEXT,
   AUDIO TEXT
)
`
const feedDDL = `
CREATE TABLE IF NOT EXISTS T_FEED(
   feedId           TEXT PRIMARY KEY,
   feedType         TEXT,
   FEED_ALIAS         TEXT,
   FEED_STATUS         TEXT
)
`
module.exports.ddl = ddl
module.exports.dictDDL = dictDDL
module.exports.feedDDL = feedDDL
