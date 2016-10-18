"use strict"


////////////////////////////////////////////////////////////
// Debugging helpers
//
// Run this in your browser console to turn on debugging
// for this package:
//
//   localstorage.setItem('Teams.debug', true)
//

Teams.debug = false

try {
  if (localStorage) {
    var temp = localStorage.getItem("Teams.debug")

    if ('undefined' !== typeof temp) {
      Teams.debug = !!temp
    }
  }
} catch (ex) {
  // ignore: accessing localStorage when its disabled throws
  // https://github.com/meteor/meteor/issues/5759
}
