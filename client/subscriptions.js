"use strict"


/**
 * Subscription handle for the currently logged in user's permissions.
 *
 * NOTE: The corresponding publish function, `_teams`, depends on
 * `this.userId` so it will automatically re-run when the currently
 * logged-in user changes.
 *
 * @example
 *
 *     `Teams.subscription.ready()` // => `true` if user teams have been loaded
 *
 * @property subscription
 * @type Object
 * @for Teams
 */

Tracker.autorun(function () {
  Teams.subscription = Meteor.subscribe("_teams");
})
