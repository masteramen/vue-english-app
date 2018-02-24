const ddl = `
CREATE TABLE IF NOT EXISTS t_article(
   ID INTEGER PRIMARY KEY     AUTOINCREMENT,
   TITLE           TEXT NOT NULL,
   CONTENT         TEXT,
   CATEGORY        TEXT,
   IMG_URL        TEXT,
   AUDIO_URL        TEXT,
   TOTAL        ,
   VIDEO_URL        TEXT,
   LRC_URL        TEXT,
   DURATION        TEXT,
   ORG_SITE       TEXT,
   REFERER        TEXT UNIQUE NOT NULL,
   AUTHOR        TEXT ,
   POST_DATE  TEXT
)
`
const dictDDL = `
CREATE TABLE IF NOT EXISTS T_DICT(
   ID INTEGER PRIMARY KEY     AUTOINCREMENT,
   QTEXT           TEXT UNIQUE NOT NULL,
   RESULT         TEXT,
   DETAIL     TEXT
)
`
module.exports.ddl = ddl
module.exports.dictDDL = dictDDL
