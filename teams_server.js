"use strict"

/**
 * Teams collection documents consist of a unique name and a path denoting
 * teams higher in that team's hierarchy
 * ex: { _id: "123", name: "teamA", path: ""
 *     { _id: "234", name: "division1", path:"teamA"},
 *     { _id: "456", name: "slave_drivers", path:"teamA-division1"},
 *     { _id: '789', name: "division2", path:"teamA"},
 *               ...
 *  Holy smokes!
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

/*Meteor.publish('_allTeams', function() {
  return Teams.find({ path:'' }, {fields: { 'name':1 }}).fetch();
});*/
