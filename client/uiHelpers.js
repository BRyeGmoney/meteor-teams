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

   /**
    * UI helper to check if current user is in at least one
    * of the target roles.  For use in client-side templates.
    *
    * @example
    *     {{#if isInRole 'admin'}}
    *     {{/if}}
    *
    *     {{#if isInRole 'editor,user'}}
    *     {{/if}}
    *
    *     {{#if isInRole 'editor,user' 'group1'}}
    *     {{/if}}
    *
    * @method isInRole
    * @param {String} role Name of role or comma-seperated list of roles
    * @param {String} [group] Optional, name of group to check
    * @return {Boolean} true if current user is in at least one of the target roles
    * @static
    * @for UIHelpers
    */
   isInTeam: function (team) {
     var user = Meteor.user(),
         comma = (team || '').indexOf(','),
         roles

     if (!user) return false
     if (!Match.test(team, String)) return false

     if (comma !== -1) {
       teams = _.reduce(team.split(','), function (memo, t) {
         if (!t || !t.trim()) {
           return memo
         }
         memo.push(t.trim())
         return memo
       }, [])
     } else {
       teams = [team];
     }

     return Teams.userIsInTeam(user, teams);
   }
 }

 ////////////////////////////////////////////////////////////
 // Register UI helpers
 //

 if (Teams.debug && console.log) {
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
 }
