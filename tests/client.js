;(function () {

  "use strict";

  var users,
      teams = ["teamA", "teamB", "divisionA", "slave_drivers"];

  users = {
    'bo': {
      _id: 'bo',
      teams: ['teamA', 'teamB']
    },
    'jangles': {
      _id: 'jangles',
      teams: ['divisionA']
    },
    'junior': {
      _id: 'junior',
      teams: ['slave_drivers']
    }
  }

  function testUser(test, username, expectedTeams) {
    var user = users[username];

    //test using user object rather than userId to avoid mocking
    _.each(teams, function(team) {
      var expected = _.contains(expectedTeams, team),
          msg = username + ' expected to have \"' + team + '\" permssion but does not',
          nmsg = username + ' had un-expected permssion ' + team;

      if (expected) {
        test.isTrue(Teams.getUserIsInTeam(user, team), msg);
      } else {
        test.isFalse(Teams.getUserIsInTeam(user, team), nmsg);
      }
    });
  }

  Meteor.user = function() {
    return users.bo;
  }

  Tinytest.add(
    'teams - can check current user\'s teams via template helper',
    function (test) {
      var isInTeam,
          expected,
          actual;

      if (!Teams._handlebarsHelpers) {
        //probably running package tests outside of a Meteor app.
        return;
      }

      isInTeam = Teams._handlebarsHelpers.isInTeam;
      test.equal(typeof isInTeam, 'function', "'isInTeam' helper not registered");

      expected = true;
      actual = isInTeam('teamA');
      test.equal(actual, expected);

      expected = true;
      actual = isInTeam('teamA, teamB');
      test.equal(actual, expected);
    })

    Tinytest.add(
      'teams - can check if user is in team',
      (test) => {
          testUser(test, 'bo', ["teamA", "teamB"]);
      })

}());
