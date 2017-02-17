"use strict";

/**
 * Convenience functions for use on client.
 *
 * NOTE: You must restrict user actions on the server-side; any
 * client-side checks are strictly for convenience and must not be
 * trusted.
 *
 * @module UIHelpers
 */

 ////////////////////////////////////////////////////////////
 // UI helpers
 //
 // Use a semi-private variable rather than declaring UI
 // helpers directly so that we can unit test the helpers.
 // XXX For some reason, the UI helpers are not registered
 // before the tests run.
 //
 Teams._uiHelpers = {
 }

 ////////////////////////////////////////////////////////////
 // Register UI helpers
 //

 /*if (Teams.debug && console.log) {
   console.log("[teams] Teams.debug =", Teams.debug);
 }

 if ('undefined' !== typeof Package.blaze &&
     'undefined' !== typeof Package.blaze.Blaze &&
     'function'  === typeof Package.blaze.Blaze.registerHelper) {
   _.each(Teams._uiHelpers, function (func, name) {
     if (Teams.debug && console.log) {
       console.log("[teams] registering Blaze helper '" + name + "'")
     }
     Package.blaze.Blaze.registerHelper(name, func)
   })
 }*/
