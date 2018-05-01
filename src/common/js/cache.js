import storage from 'good-storage'
import * as envApi from './env-api'
const SEARCH_KEY = '__search__'
const SEARCH_MAX_LEN = 15

const PLAY_KEY = '__play__'
const PLAY_MAX_LEN = 200

const FAVORITE_KEY = '__favorite__'
const FAVORITE_MAX_LEN = 200

const SUBSCRIPTION_KEY = '__subscription__'
const LAST_FRESH_KEY = 'LAST_FRESH_KEY'

function insertArray(arr, val, compare, maxLen) {
  const index = arr.findIndex(compare)
  if (index === 0) {
    return
  }
  if (index > 0) {
    arr.splice(index, 1)
  }
  arr.unshift(val)
  if (maxLen && arr.length > maxLen) {
    arr.pop()
  }
}

function deleteFromArray(arr, compare) {
  const index = arr.findIndex(compare)
  if (index > -1) {
    arr.splice(index, 1)
  }
}

export function saveSearch(query) {
  let searches = storage.get(SEARCH_KEY, [])
  insertArray(searches, query, (item) => {
    return item === query
  }, SEARCH_MAX_LEN)
  storage.set(SEARCH_KEY, searches)
  return searches
}

export function deleteSearch(query) {
  let searches = storage.get(SEARCH_KEY, [])
  deleteFromArray(searches, (item) => {
    return item === query
  })
  storage.set(SEARCH_KEY, searches)
  return searches
}

export function clearSearch() {
  storage.remove(SEARCH_KEY)
  return []
}

export function loadSearch() {
  return storage.get(SEARCH_KEY, [])
}

export function savePlay(song) {
  let songs = storage.get(PLAY_KEY, [])
  insertArray(songs, song, (item) => {
    return song.id === item.id
  }, PLAY_MAX_LEN)
  storage.set(PLAY_KEY, songs)
  return songs
}

export function loadPlay() {
  return storage.get(PLAY_KEY, [])
}

export function saveFavorite(song) {
  let songs = storage.get(FAVORITE_KEY, [])
  insertArray(songs, song, (item) => {
    return song.id === item.id
  }, FAVORITE_MAX_LEN)
  storage.set(FAVORITE_KEY, songs)
  return songs
}

export function deleteFavorite(song) {
  let songs = storage.get(FAVORITE_KEY, [])
  deleteFromArray(songs, (item) => {
    return item.id === song.id
  })
  storage.set(FAVORITE_KEY, songs)
  return songs
}

export function loadFavorite() {
  return storage.get(FAVORITE_KEY, [])
}

export function loadSubscriptionList() {
  let obj = storage.get(SUBSCRIPTION_KEY, [])
  console.log('subscriptionkey')
  console.log(obj)
  return obj
}

export function addSubcription(feed) {
  let songs = storage.get(SUBSCRIPTION_KEY, [])
  console.log('addSubcription')
  const index = songs.findIndex(e => e.feedId === feed.feedId)
  envApi.removeFeed(feed)
  if (feed.status && feed.enable) {
    envApi.saveFeed(feed)
  }

  if (index > -1) {
    if (!feed.status) {
      songs.splice(index, 1)
    } else Object.assign(songs[index], feed)
  } else {
    songs.push(feed)
  }

  storage.set(SUBSCRIPTION_KEY, songs)
  console.log(feed)
  return songs
}
export function getOrSetRefreshTime(updateTime) {
  if (updateTime) {
    storage.set(LAST_FRESH_KEY, updateTime)
  }

  return storage.get(LAST_FRESH_KEY, '')
}
const KEY_SETTING_CONFIG = 'setting_config'
export function getOrSetSetting(config) {
  if (config) {
    storage.set(KEY_SETTING_CONFIG, config)
  }

  return storage.get(KEY_SETTING_CONFIG, {
    checklistValues: ['disp-new-word-ts', 'disp-p-ts'],
    isDebug: 0,
    nDay: '3'
  })
}
