import {playMode} from 'common/js/config'
import {loadSearch, loadPlay, loadFavorite, loadSubscriptionList} from 'common/js/cache'

const state = {
  singer: {},
  playing: false,
  downloadAll: false,
  fullScreen: false,
  editMode: false,
  playlist: [],
  sequenceList: [],
  mode: playMode.sequence,
  currentIndex: -1,
  disc: {},
  topList: {},
  searchHistory: loadSearch(),
  playHistory: loadPlay(),
  favoriteList: loadFavorite(),
  subscriptionList: loadSubscriptionList()
}
export default state
