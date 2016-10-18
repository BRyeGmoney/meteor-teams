"use strict"

/**
 * Teams collection documents consist of a cascading tree
 * defining a team's structure.
 * ex: { _id: "123", name: "teamA",
 *       teams: [
 *               { _id: "234", name: "division1", teams:[]},
 *               { _id: "456", name: "division2", teams:[]},
 *               ...
 *              ]} Holy smokes!
 */
if (!Meteor.teams) {
  Meteor.teams = new Mongo.Collection("teams");

  Meteor.teams._ensureIndex('name', {unique:1});
}

/**
 * Publish logged-in user's teams so client side checks can work.
 *
 * Use a named publish function so clients can check 'ready()' state.
 */
Meteor.publish('_teams', function() {
  var loggedInUserId = this.userId,
      fields = { teams: 1 };

  if (!loggedInUserId) {
    this.ready();
    return;
  }

  return Meteor.users.find({_id: loggedInUserId},
                           {fields: fields});
});
