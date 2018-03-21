const ddl = `
CREATE TABLE IF NOT EXISTS t_article(
   ID INTEGER PRIMARY KEY     AUTOINCREMENT,
   TITLE           TEXT NOT NULL,
   TITLE_CN         TEXT,
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
   POST_DATE  TEXT,
   STATUS  TEXT DEFAULT 'A',
   FEED_ID    TEXT,
   FEED_TYPE    TEXT
)
`
const dictDDL = `
CREATE TABLE IF NOT EXISTS T_DICT(
   ID INTEGER PRIMARY KEY     AUTOINCREMENT,
   QTEXT           TEXT UNIQUE NOT NULL,
   RESULT         TEXT,
   DETAIL     TEXT,
   AUDIO TEXT
)
`
module.exports.ddl = ddl
module.exports.dictDDL = dictDDL
