;(function() {
  var users = {},
      teams = ["teamA", "teamB", "divisionA", "slave_drivers"];

    //use to run individual tests
    //Tinytest.oadd = Tinytest.add
    //Tinytest.add = function () {}

    function addUser(name) {
      return Accounts.createUser({'username':name});
    }

    function reset () {
      Meteor.teams.remove({});
      Meteor.users.remove({});

      users = {
        'bo': addUser("bo"),
        'jangles': addUser("jangles"),
        'junior': addUser("junior")
      };
    }

    function testUserTeamsOnly(test, username, expectedTeams) {
      var userId = users[username],
        userObj = Meteor.users.findOne({_id:userId});

      //check using user ids (makes db calls)
      _innerTest(test, userId, username, expectedTeams);

      //check using passed-in user object
      _innerTest(test, userObj, username, expectedTeams);
    }

    function _innerTest(test, userParam, username, expectedTeams) {
      _.each(teams, function(team) {
        var expected = _.contains(expectedTeams, team),
          msg = username + ' expected to have \"' + team + '\" permission but does not',
          nmsg = username + ' had the following un-expected permission: ' + team;

          if (expected) {
            test.isTrue(Teams.userIsInTeam(userParam, team), msg);
          } else {
            test.isFalse(Teams.userIsInTeam(userParam, team), nmsg);
          }
      });
    }

    Tinytest.add(
      'teams - can create and delete teams',
       (test) => {
        reset();

        Teams.createTeam('teamA');
        test.equal(Meteor.teams.findOne().name, 'teamA');

        Teams.createTeam('teamB');
        test.equal(Meteor.teams.findOne({'name': 'teamB'}).name, "teamB");

        test.equal(Meteor.teams.find().count(), 2);

        Teams.deleteTeam('teamA');
        test.equal(typeof Meteor.teams.findOne({'name':'teamA'}), 'undefined');

        Teams.deleteTeam('teamB');
        test.equal(typeof Meteor.teams.findOne(), 'undefined');
      })

      Tinytest.add(
        'teams - can\'t create duplicate teams',
        (test) => {
          reset();

          Teams.createTeam('teamA', '');
          test.throws(() => { Teams.createTeam('teamA', '') });
        })

      Tinytest.add(
        'teams - can\'t create team with empty name',
        (test) => {
          reset();

          Teams.createTeam('');
          Teams.createTeam(null);

          test.equal(Meteor.teams.find().count(), 0);

          Teams.createTeam(' ');
          test.equal(Meteor.teams.find().count(), 0);
      })

      Tinytest.add(
        'teams - can add owning teams',
        (test) => {
          reset();

          Teams.createTeam('teamA');
          Teams.createTeam('divisionA', 'teamA');
          test.equal(Meteor.teams.findOne({'name':'divisionA'}).path, "teamA");

          Teams.createTeam('slave_drivers', 'divisionA');
          test.equal(Meteor.teams.findOne({'name': 'slave_drivers'}).path, 'teamA-divisionA');
      })

      Tinytest.add(
        'teams - can check if user is part of higher organization',
        (test) => {
          reset();

          Teams.createTeam('teamA');
          Teams.createTeam('divisionA', 'teamA');
          Teams.createTeam('slave_drivers', 'divisionA');
          Teams.addUsersToTeams(users.bo, ['slave_drivers']);

          test.isFalse(Teams.userIsInTeam(users.bo, 'teamA'));
          test.equal(Teams.getFullPathForTeam('slave_drivers'), 'teamA-divisionA-slave_drivers');
          test.isTrue(Teams.userBelongsToTeam(users.bo, 'teamA'));
      })

      Tinytest.add(
        'teams - can check if user is in team',
        (test) => {
          reset();

          Meteor.users.update(
            {"_id":users.bo},
            {$addToSet: { teams: { $each: ['teamA', 'teamB'] } } }
          );

          testUserTeamsOnly(test, 'bo', ['teamA', 'teamB']);
        })

      Tinytest.add(
        'teams - can check if user in team that belongs to another team',
        (test) => {
          reset();
          test.isFalse(Teams.userIsInTeam('1', "teamA"));
      })

      Tinytest.add(
        'teams - can check if null user is in role',
        (test) => {
          var user = null;
          reset();

          test.isFalse(Teams.userIsInTeam(user, "teamA"));
      })

      Tinytest.add(
        'teams - can check user against several teams at once',
        (test) => {
          var user;
          reset();

          Teams.addUsersToTeams(users.bo, ['teamA', 'teamB']);
          user = Meteor.users.findOne({_id:users.bo});

          test.isTrue(Teams.userIsInTeam(user, ['divisionA', 'teamB']));
        })

      Tinytest.add(
        'teams - can\'t add non-existent user to team',
        (test) => {
          reset();

          Teams.addUsersToTeams(['2'], ['teamA']);
          test.equal(Meteor.users.findOne({_id:'2'}), undefined);
        })

      Tinytest.add(
        'teams - can add individual users to teams',
        (test) => {
          reset();

          Teams.addUsersToTeams(users.bo, ['teamA', 'teamB']);

          testUserTeamsOnly(test, 'bo', ['teamA', 'teamB']);
          testUserTeamsOnly(test, 'jangles', []);
          testUserTeamsOnly(test, 'junior', []);

          Teams.addUsersToTeams(users.junior, ['divisionA']);

          testUserTeamsOnly(test, 'bo', ['teamA', 'teamB']);
          testUserTeamsOnly(test, 'jangles', []);
          testUserTeamsOnly(test, 'junior', ['divisionA']);
        })

      Tinytest.add(
        'teams - can add user to roles via user object',
        (test) => {
          reset();

          var bo = Meteor.users.findOne({_id:users.bo}),
              jangles = Meteor.users.findOne({_id: users.jangles});

          Teams.addUsersToTeams(bo, ['teamA', 'teamB']);

          testUserTeamsOnly(test, 'bo', ['teamA', 'teamB']);
          testUserTeamsOnly(test, 'jangles', []);
          testUserTeamsOnly(test, 'junior', []);

          Teams.addUsersToTeams(jangles, ['divisionA']);

          testUserTeamsOnly(test, 'bo', ['teamA', 'teamB']);
          testUserTeamsOnly(test, 'jangles', ['divisionA']);
          testUserTeamsOnly(test, 'junior', []);
        })

      Tinytest.add(
        'teams - can add user to teams multiple times',
        (test) => {
          reset();

          Teams.addUsersToTeams(users.bo, ['teamA', 'teamB']);
          Teams.addUsersToTeams(users.bo, ['teamA', 'teamB']);

          testUserTeamsOnly(test, 'bo', ['teamA', 'teamB']);
          testUserTeamsOnly(test, 'jangles', []);
          testUserTeamsOnly(test, 'junior', []);

          Teams.addUsersToTeams(users.jangles, ['teamA']);
          Teams.addUsersToTeams(users.jangles, ['divisionA']);

          testUserTeamsOnly(test, 'bo', ['teamA', 'teamB']);
          testUserTeamsOnly(test, 'jangles', ['teamA', 'divisionA']);
          testUserTeamsOnly(test, 'junior', []);
        })

      Tinytest.add(
        'teams - can add multiple users to teams',
        (test) => {
          reset();

          Teams.addUsersToTeams([users.bo, users.jangles], ['teamA', 'teamB']);

          testUserTeamsOnly(test, 'bo', ['teamA', 'teamB']);
          testUserTeamsOnly(test, 'jangles', ['teamA', 'teamB']);
          testUserTeamsOnly(test, 'junior', []);

          Teams.addUsersToTeams([users.jangles, users.junior], ['teamB', 'divisionA']);

          testUserTeamsOnly(test, 'bo', ['teamA', 'teamB']);
          testUserTeamsOnly(test, 'jangles', ['teamA', 'teamB', 'divisionA']);
          testUserTeamsOnly(test, 'junior', ['teamB', 'divisionA']);
        })

      Tinytest.add(
        'teams - can remove individual users from teams',
        (test) => {
          reset();

          //remove user team - one user
          Teams.addUsersToTeams([users.bo, users.jangles], ['teamA', 'teamB']);
          testUserTeamsOnly(test, 'bo', ['teamA', 'teamB']);
          testUserTeamsOnly(test, 'jangles', ['teamA', 'teamB']);

          Teams.removeUsersFromTeams(users.bo, ['teamB']);
          testUserTeamsOnly(test, 'bo', ['teamA']);
          testUserTeamsOnly(test, 'jangles', ['teamA', 'teamB']);
        })

        Tinytest.add(
          'teams - can remove user from teams multiple times',
          (test) => {
            reset();

            //remove user team - one user
            Teams.addUsersToTeams([users.bo, users.jangles], ['teamA', 'teamB']);
            testUserTeamsOnly(test, 'bo', ['teamA', 'teamB']);
            testUserTeamsOnly(test, 'jangles', ['teamA', 'teamB']);

            Teams.removeUsersFromTeams(users.bo, ['teamB']);
            testUserTeamsOnly(test, 'bo', ['teamA']);
            testUserTeamsOnly(test, 'jangles', ['teamA', 'teamB']);

            //try remove agains
            Teams.removeUsersFromTeams(users.bo, ['teamB']);
            testUserTeamsOnly(test, 'bo', ['teamA']);
          })

        Tinytest.add(
          'teams - can remove users from teams via user object',
          (test) => {
            reset();

            var bo = Meteor.users.findOne({_id:users.bo}),
                jangles = Meteor.users.findOne({_id:users.jangles});

            //remove user team - one user
            Teams.addUsersToTeams([bo, jangles], ['teamA', 'teamB']);
            testUserTeamsOnly(test, 'bo', ['teamA', 'teamB']);
            testUserTeamsOnly(test, 'jangles', ['teamA', 'teamB']);
            Teams.removeUsersFromTeams(bo, ['teamB']);
            testUserTeamsOnly(test, 'bo', ['teamA']);
            testUserTeamsOnly(test, 'jangles', ['teamA', 'teamB']);
          })

        Tinytest.add(
          'teams - can remove multiple users from teams',
          (test) => {
            reset();

            Teams.addUsersToTeams([users.bo, users.jangles], ['teamA', 'teamB']);
            testUserTeamsOnly(test, 'bo', ['teamA', 'teamB']);
            testUserTeamsOnly(test, 'jangles', ['teamA', 'teamB']);

            test.isFalse(Teams.userIsInTeam(users.junior, 'teamA'));
            Teams.addUsersToTeams([users.bo, users.junior], ['teamA', 'divisionA']);
            testUserTeamsOnly(test, 'bo', ['teamA', 'teamB', 'divisionA']);
            testUserTeamsOnly(test, 'junior', ['teamA', 'divisionA']);

            Teams.removeUsersFromTeams([users.bo, users.junior], ['teamA']);
            testUserTeamsOnly(test, 'bo', ['teamB', 'divisionA']);
            testUserTeamsOnly(test, 'junior', ['divisionA']);
          }
        )


}());