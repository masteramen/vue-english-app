const getVideoInfo = require('get-video-info-url')
 
getVideoInfo('http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4').then(info => {
  console.log(info.format.duration) // => 10.007000
})