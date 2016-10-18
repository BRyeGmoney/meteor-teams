;(function() {

/**
 * Provides functions related to user authorization. Compatible with built-in Meteor accounts package.
 *
 * @module Teams
 */

/**
 * Teams collection documents consist of blah blah
 *
 */
if (!Meteor.teams) {
  Meteor.teams = new Mongo.Collection("teams");
}

if ('undefined' === typeof Teams) {
  Teams = {};
}

"use strict";

_.extend(Teams, {
  /*
   * Create a new team. Outside whitespace will be trimmed. Inside will be converted to _
   *
   * @method createTeam
   * @param {String} team Name of team
   * @param {String} owningTeam id of owning team
   * @return {String} id of new team
   */
   createTeam: function (team, owningTeam) {
     var id,
         match;

     if (!team
         || 'string' !== typeof team
         || team.trim().length == 0) {
           return;
     }
     var teamNameToInsert = team.trim().replace(/\s/g, '_');
     try {
       if (!owningTeam) {
         id = Meteor.teams.insert({'name': teamNameToInsert, 'path': null });
       } else {

         if (typeof owningTeam === 'object') owningTeam = owningTeam.name;

         id = Meteor.teams.insert({'name': teamNameToInsert,
                                   'path': Teams.getFullPathForTeam(owningTeam) });
       }
       return id;
     } catch(e) {
       // (from Meteor accounts-base package, insertUserDoc func)
       // XXX string parsing sucks, maybe
       // https://jira.mongodb.org/browse/SERVER-3069 will get fixed one day
       if (/E1100 duplicate key error.*(index.*teams|teams.*index).*name/.test(e.err || e.errmsg)) {
         throw new Error("Team '" + teamNameToInsert + "' already exists.");
       } else {
         throw e;
       }
     }
   },
   /**
    * Delete an existing team. Will throw "Team in use" error if any users
    * are currently assigned to the target team.
    *
    * @method deleteTeam
    * @param {String} team Name of team
    */
    deleteTeam: function(team) {
      if (!team) return;

      var foundExistingUser = Meteor.users.findOne(
                                {teams: {$in: [team]}},
                                {fields: {_id: 1}});

      var thisTeam = Meteor.teams.findOne({name: team});
      if (thisTeam) {
        Meteor.teams.remove({_id: thisTeam._id});
      }
    },
    addUsersToTeams: function (users, teams) {
      //use Template pattern to update user teams
      Teams._updateUserTeams(users, teams, Teams._update_$addToSet_fn);
    },
    setUserTeams: function(users, teams) {
      Teams._updateUserTeams(users, teams, Teams._update_$set_fn);
    },
    removeUsersFromTeams: function (users, teams) {
      var update;

      if (!users) throw new Error("Missing 'users' param");
      if (!teams) throw new Error("Missing 'teams' param");


      //ensure arrays
      if (!_.isArray(users)) users = [users];
      if (!_.isArray(teams)) teams = [teams];

      //ensure users is an array of user ids
      users = _.reduce(users, function (memo, user) {
        var _id
        if ('string' === typeof user) {
          memo.push(user)
        } else if ('object' === typeof user) {
          _id = user._id
          if ('string' === typeof _id) {
            memo.push(_id)
          }
        }
        return memo
      }, []);

      //update all users, remove from teams set_fn
      update = {$pullAll: {teams: teams}};

      try {
        if (Meteor.isClient) {
          //Iterate over each user to fulfill Meteor's 'one update per ID' policy
          _.each(users, function(user) {
              Meteor.users.update({_id:user}, update);
          });
        } else {
          //On the server we can leverage MongoDB's $in operator for performance
          Meteor.users.update({_id:{$in:users}}, update, {multi:true});
        }
      }
      catch (ex) {
        /*if (ex.name === 'MongoError' && isMongoMixError(ex.err || ex.errmsg)) {
          throw new Error (mixingGroupAndNonGroupErrorMsg)
        }*/

        throw ex;
      }
    },
    getPathForTeam: function(teamName) {
      if (typeof teamName === 'string') {
        return Meteor.teams.findOne({name: teamName}).path;
      } else {
        throw new Error('Passed in param \'teamName\' is not a string');
      }
    },
    getFullPathForTeam: function(teamName) {
      if (typeof teamName === 'string') {
        let path = Teams.getPathForTeam(teamName);
        if (path) { //we just concatenate the team name to it's path
          return path + '-' + teamName;
        } else { //there is no path for this team
          return teamName;
        }
      }
    },
    getAllTeamsUnderTeam: function(team) {
      if (typeof team === 'object') {
        team = team.name;
      }

      if (typeof team === 'string') {
        //console.log(new RegExp('^' + team + '-'));
        console.log(Meteor.teams.find({}, {fields: {_id:0, name:1, path:1}}).fetch());
        let teams = Meteor.teams.find({ 'path' : new RegExp('^' + team) },
                      { fields: {_id: 0, name:1}}).fetch();

        console.log(teams);
        return teams;
      }
    },
    isAncestorForTeam: function(team, potentialAncestor) {
      if (typeof team === 'string') {
        return Teams.getFullPathForTeam(team).includes(potentialAncestor);
      } else if (typeof team === 'object') {
        return Teams.getFullPathForTeam(team.name).includes(potentialAncestor);
      } else {
        return false
      }
    },
    userBelongsToTeam: function(user, teams) {
      var id,
          userTeams,
          query,
          found = false;

      //ensure array to simplify code
      if (!_.isArray(teams)) {
        teams = [teams];
      }

      if (!user) return false;

      if ('string' === typeof user) {
        user = Meteor.users.findOne({_id:user}, {fields: {_id:1, teams:1}});
      }

      if ('object' === typeof user) {
        userTeams = user.teams;
        if (!_.isArray(userTeams)) userTeams = [userTeams];

        if (_.isArray(userTeams)) {
          /*for(var i = 0; i < userTeams.length; i++) {
            if (userTeams[i])
          }*/
          /*return _.some(userTeams, function(userTeam) {
            return _.some(teams, function(team) {
              return Teams.isAncestorForTeam(userTeam, team);
            });
          });*/

          return _.some(teams, function(team) {
            return _.some(userTeams, function(userTeam) {
              return Teams.isAncestorForTeam(userTeam, team);
            })
            //return isAncestorForTeam(userTeams)//_.contains(userTeams, team);
          });
        }
      }
    },
    userIsInTeam: function(user, teams) {
      var id,
          userTeams,
          query,
          found = false;

      //ensure array to simplify code
      if (!_.isArray(teams)) {
        teams = [teams];
      }

      if (!user) return false;

      if ('object' === typeof user) {
        userTeams = user.teams;

        if (_.isArray(userTeams)) {
          return _.some(teams, function(team) {
            return _.contains(userTeams, team);
          });
        } else if (userTeams && 'object' === typeof userTeams) {
          //this is for if i ever choose to make teams more like dictionaries ala roles/groups
        }

        //missing the teams field, try going direct via id
        id = user._id;
      } else if ('string' === typeof user) {
        id = user;
      }

      if (!id) return false;

      query = {_id:id, $or: []};

      //structure of query
      //Teams
      //  {_id: id,
      //   $or: [
      //     {teams: {$in: ['teamA']}}
      //   ]
      // }
      query = {_id: id, teams: {$in: teams}};

      found = Meteor.users.findOne(query, {fields: {_id:1}});
      return found ? true : false;
    },
    /**
     * Private function 'template' that uses $set to construct an update object
     * for MongoDB.  Passed to _updateUserTeams
     *
     * @method _update_$set_fn
     * @protected
     * @param {Array} teams
     * @return {Object} update object for use in MongoDB update command
     */
     _update_$set_fn: function (teams) {
       var update = {};

       update.$set= {teams:teams};
       return update;
     },
     /**
      * Private function 'template' that uses $addToSet to construct an update
      * object for MongoDB.  Passed to _updateUserTeams
      *
      * @method _update_$addToSet_fn
      * @protected
      * @param {Array} teams
      * @return {Object} update object for use in MongoDB update command
      */
      _update_$addToSet_fn: function(teams) {
        var update = {};

        update.$addToSet = {teams: {$each: teams}};

        return update;
      },
      _updateUserTeams: function(users, teams, updateFactory) {
        if (!users) throw new Error("Missing 'users' param");
        if (!teams) throw new Error("Missing 'teams' param");

        var existingTeams,
            query,
            update;

        //ensure arrays to simplify code
        if (!_.isArray(users)) users = [users];
        if (!_.isArray(teams)) teams = [teams];

        //remove invalid teams
        teams = _.reduce(teams, (memo, team) => {
          if (team
              && 'string' === typeof team
              && team.trim().length > 0) {
            memo.push(team.trim());
          }
          return memo;
        }, []);

        //empty teams array is ok, since it might be a $set operation to clear
        //teams
        //if (teams.length === 0) return
        //not sure why the above is here. perhaps might need in future

        //ensure all teams exist in 'teams' collection
        existingTeams = _.reduce(Meteor.teams.find({}).fetch(), (memo, team) => {
          memo[team.name] = true;
          return memo;
        }, {});

        _.each(teams, (team) => {
          if (!existingTeams[team]) {
            Teams.createTeam(team);
          }
        });

        //ensure users is an array of user ids
        users = _.reduce(users, (memo, user) => {
          var _id;
          if ('string' === typeof user) {
            memo.push(user);
          } else if ('object' === typeof user) {
            _id = user._id;
            if ('string' === typeof _id) {
              memo.push(_id);
            }
          }
          return memo;
        }, []);

        //update all users
        update = updateFactory(teams);

        try {
          if (Meteor.isClient) {
            //on client, iterate over each user to fulfill Meteor's
            //'one update per ID' policy
            _.each(users, (user) => {
              Meteor.users.update({_id:user}, update);
            });
          } else {
            //On the server we can use MongoDB's $in operator for
            //better performance
            Meteor.users.update({_id:{$in: users}},
                                update,
                                {multi:true});
          }
        }
        catch(ex) {
          throw ex;
        }
      }//end _updateUserTeams
}); //end _.extend(Teams ...)
}());
