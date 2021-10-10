/**
 * Here we setup base config hosts and endpoints
 *
 */
window._devMonitConfig = {
  api_prefix: '/',
  socketio_prefix: undefined
  // api_prefix: 'https://testmoveh.com/',
  // socketio_prefix: 'https://testmoveh.com:443/socket.io/'
}

// if(_devMonitConfig.socket.host && _devMonitConfig.socket.port) {
//   let script = document.createElement('script')
//   script.src=_devMonitConfig.socket.host +  _devMonitConfig.socket.port + '/socket.io' + '/socket.io.js'
//   script.src = script.src.replace("wss://","https://")
//   script.src = script.src.replace("ws://","http://")
//   document.querySelector('head').appendChild(script)
// }
