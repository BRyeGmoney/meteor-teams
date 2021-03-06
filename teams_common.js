;(function() {

/**
 * Provides functions related to user authorization. Compatible with built-in Meteor accounts package.
 *
 * @module Teams
 */

 /**
  * Teams collection documents consist of an id, team name and mongo materialized path
  *   ex: { _id:<uuid>, name: "teamName", path: "parentTeams" }
  */
if (!Meteor.teams) {
  Meteor.teams = new Mongo.Collection("teams");
}

/**
 * Authorization package compatible with built-in Meteor accounts system.
 *
 * Stores user's current roles and team associations in a 'teams' field on the user object.
 *
 * @class Teams
 * @constructor
 */
if ('undefined' === typeof Teams) {
  Teams = {};
}

"use strict";

_.extend(Teams, {
  /**
   * Create a new team. Outside whitespace will be trimmed. Inside will be converted to _
   *
   * @method createTeam
   * @param {String} team - Name of team
   * @param {String} owningTeam - Id of owning team
   * @return {String} The id of the newly created team
   */
   createTeam: function (team, parentTeam) {
     var id,
         match;

     if (!team
         || 'string' !== typeof team
         || team.trim().length == 0) {
           return;
     }
     var teamNameToInsert = team.trim();//.replace(/\s/g, '_');
     try {
       if (!parentTeam) {
         id = Meteor.teams.insert({'name': teamNameToInsert, 'path': '' });
       } else {

         if (typeof parentTeam === 'object') parentTeam = parentTeam.name;

         if (!Meteor.teams.findOne({'name': parentTeam})) {
           throw new Meteor.Error(500, "Parent team does not exist.");
         }

         id = Meteor.teams.insert({'name': teamNameToInsert,
                                   'path': Teams._getFullPathForTeam(parentTeam) });
       }
       return id;
     } catch(e) {
       // (from Meteor accounts-base package, insertUserDoc func)
       // XXX string parsing sucks, maybe
       // https://jira.mongodb.org/browse/SERVER-3069 will get fixed one day
       if (/E1100 duplicate key error.*(index.*teams|teams.*index).*name/.test(e.err || e.errmsg)) {
         throw new Meteor.Error(500, "Team '" + teamNameToInsert + "' already exists.");
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
    * @param {String} team - Name of team
    */
    deleteTeam: function(team) {
      if (!team) return;

      var foundExistingUser = Meteor.users.findOne(
                                {teams: {$in: [team]}},
                                {fields: {_id: 1}});

      var foundSubTeam = Teams.getAllTeamsUnderTeam(team);


      if (foundExistingUser || foundSubTeam.length > 0) {
        throw new Meteor.Error(403, 'Team in use');
      }

      var thisTeam = Meteor.teams.findOne({name: team});
      if (thisTeam) {
        Meteor.teams.remove({_id: thisTeam._id});
      }
    },
    /**
     * Add the user(s) to a single or multiple team(s) with no roles
     *
     * @method addUsersToTeams
     * @param {Array|String} users - The user object(s) or id(s) of all users to modify
     * @param {Array|String} teams - The name(s) of the team(s) this user(s) will be a part of
     */
    addUsersToTeams: function (users, teams) {
      Teams.addUsersToRolesInTeams(users, null, teams);
    },
    /**
      * Add role(s) to all team(s) for all user(s).
      *
      * @method addUsersToRolesInTeams
      * @param {Array|String} users - User id(s) or object(s) with an _id field
      * @param {Array|String} roles - Name(s) of roles/permissions to add users to
      * @param {Array|String} teams - Name(s) of team(s) that the role(s) will be applied to
      */
    addUsersToRolesInTeams: function(users, roles, teams) {
      Teams._updateUserTeams(users, teams, roles, Teams._update_$addToSet_fn);
    },
    /**
      * Set the user(s) to a single or multiple team(s) with no roles. This
      * removes all current teams and their roles so that only the teams passed
      * are part of the user(s) list of teams.
      *
      * @method setUsersTeams
      * @param {Array|String} users - User id(s) or object(s) with an _id field
      * @param {Array|String} teams - Name(s) of team(s) that the user(s) will be a part of
      */
    setUsersTeams: function(users, teams) {
      Teams.setUsersRolesInTeams(users, null, teams);
    },
    /**
      * Set the user(s) to a single or multiple team(s) with the passed in role(s). This
      * removes all current teams and their roles so that only the team(s) and role(s) passed
      * are part of the user(s) list of teams.
      *
      * @method setUsersRolesInTeams
      * @param {Array|String} users - User id(s) or object(s) with an _id field
      * @param {Array|String} roles - Name(s) of roles/permissions to add users to
      * @param {Array|String} teams - Name(s) of team(s) that the user(s) will be a part of
    */
    setUsersRolesInTeams: function(users, roles, teams) {
      Teams._updateUserTeams(users, teams, roles, Teams._update_$set_fn);
    },
    /**
      * Removes the desired role(s) from the desired teams. Does not remove the user(s)
      * from the team(s).
      *
      * @method removeUsersFromRolesInTeams
      * @param {Array|String} users - User id(s) or object(s) with an _id field
      * @param {Array|String} roles - Name(s) of roles/permissions to add users to
      * @param {Array|String} teams - Name(s) of team(s) that the user(s) will be a part of
    */
    removeUsersFromRolesInTeams: function(users, roles, teams) {
      var update;

      if (!users) throw new Error("Missing 'users' param");
      if (!teams) throw new Error("Missing 'teams' param");
      if (!roles) throw new Error("Missing 'roles' param");

      //ensure arrays
      if (!_.isArray(users)) users = [users];
      if (!_.isArray(teams)) teams = [teams];
      if (!_.isArray(roles)) roles = [roles];

      //ensure users is an array of user ids
      users = _.reduce(users, function(memo, user) {
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

      _.each(teams, (team) => {
        update = {$pullAll: {}};
        update.$pullAll['teams.'+team] = roles;

        try {
          if (Meteor.isClient) {
            //Iterate over each user to fulfill Meteor's 'one update per ID' policy
            _.each(users, (user) => {
              Meteor.users.update({_id:user}, update);
            });
          } else {
            //On the serer we can leverage MongoDB's $in operator for performance
            Meteor.users.update({_id:{$in:users}}, update, {multi:true});
          }
        }
        catch (ex) {
          throw ex;
        }
      });
    },
    /**
      * Removes any associations the user has with the passed in team(s).
      *
      * @method removeUsersFromTeams
      * @param {Array|String} users - User id(s) or object(s) with an _id field
      * @param {Array|String} teams - Name(s) of team(s) that the user(s) is to be removed from
    */
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

      _.each(teams, (team) => {
        //update all users, remove from teams set_fn
        update = {$unset: {}};
        update.$unset['teams.'+team] = 1;

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
          throw ex;
        }
      });
    },
    /*
      * Private function that returns the materialized path for the team
      * passed in.
    */
    _getPathForTeam: function(teamName) {
      if (typeof teamName === 'string') {
        return Meteor.teams.findOne({name: teamName}).path;
      } else {
        throw new Error('Passed in param \'teamName\' is not a string');
      }
    },
    /*
      * Private function that returns the materialized path for the team
      * passed in along with the team itself.
    */
    _getFullPathForTeam: function(teamName) {
      if (typeof teamName === 'string') {
        let path = Teams._getPathForTeam(teamName);
        if (path) { //we just concatenate the team name to it's path
          return path + '-' + teamName;
        } else { //there is no path for this team
          return teamName;
        }
      }
    },
    /**
     * Returns all the teams that are direct and indirect(descendants) children
     * of the passed in team.
     *
     * @method getAllTeamsUnderTeam
     * @param {String} team - Name of team that you wish to get all the children of
     * @return {Array} An array of ALL (down all branches) team names associated
     * with the passed in team as children.
     */
    getAllTeamsUnderTeam: function(team) {
      if (typeof team === 'object') {
        team = team.name;
      }

      if (typeof team === 'string') {
        let teams = Meteor.teams.find({ 'path' : new RegExp(team) }, //'^' +
                      { fields: {_id: 1, name:1}}).fetch();

        return teams;
      }
    },
    /**
     * Returns only the teams that are direct children of the passed in team.
     *
     * @method getTeamsDirectlyUnderTeam
     * @param {String} team - Name of team that you wish to get all the children of
     * @return {Array} An array of team names associated with the passed in team as
     * direct children. Does not go deeper than one level.
     */
    getTeamsDirectlyUnderTeam: function(team) {
      if (typeof team === 'object') {
        team = team.name;
      }

      if (typeof team === 'string') {
        let teams = Meteor.teams.find({ 'path': new RegExp(team+"$") },
                      { fields: {_id: 1, name:1}}).fetch();

        return teams;
      }
    },
    /*
     * Private function that takes in two team names. It takes the materialized
     * path of the first, and does a simple check through the path to see if the
     * second is a parent somewhere upwards.
    */
    _isAncestorForTeam: function(team, potentialAncestor) {
      if (typeof team === 'string') {
        return Teams._getFullPathForTeam(team).includes(potentialAncestor);
      } else if (typeof team === 'object') {
        return Teams._getFullPathForTeam(Object.keys(team)[0]).includes(potentialAncestor);
      } else {
        return false;
      }
    },
    /**
     * Checks whether the user belongs either directly to the passed in team or
     * to a descendant of the passed in team.
     *
     * @method userBelongsToTeams
     * @param {String} user - The user who you wish to check
     * @param {Array} teams - Name(s) of team(s) that you wish to check the user
     * against
     * @return {Boolean} Whether the user is associated at all with any of the
     * teams
     */
    userBelongsToTeams: function(user, teams) {
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

          return _.some(teams, function(team) {
            return _.some(userTeams, function(userTeam) {
              return Teams._isAncestorForTeam(userTeam, team);
            });
          });
        }
      }
    },
    /**
     * Checks to make sure that the user has any of the roles in any of the
     * teams.
     *
     * @method userHasRolesInTeams
     * @param {String} user - The user who you wish to check
     * @param {Array} roles - The roles you wish to check the user against
     * @param {Array} teams - Name(s) of team(s) that you wish to check the user
     * against
     * @return {Boolean} Whether the user has any of the roles in any of the teams
    */
    userHasRolesInTeams: function(user, roles, teams) {
      var hasRole = false;

      if (!_.isArray(teams)) teams = [teams];
      if (!_.isArray(roles)) roles = [roles];

      return _.some(teams, (team) => {
        return _.some(roles, (role) => {
          return _.contains(Teams.getRolesInTeamForUser(user, team), role);
        });
      });
    },
    /**
     * Checks to make sure that the user is directly associated with any of the
     * provided teams.
     *
     * @method userIsInTeam
     * @param {String} user - The user who you wish to check
     * @param {Array} teams - Name(s) of team(s) that you wish to check the user
     * against
     * @return {Boolean} Whether the user is directly a part of any of the teams
    */
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
          return _.some(teams, (team) => {
            return userTeams[team] ? true : false;
          });

        }

        //missing the teams field, try going direct via id
        id = user._id;
      } else if ('string' === typeof user) {
        id = user;
      }

      if (!id) return false;

      query = {_id:id, $or: []};

      //throw each team query in too
      _.some(teams, (team) => {
        teamQuery = {};
        teamQuery['teams.' + team] = {$exists:true};
        query.$or.push(teamQuery);
      });

      found = Meteor.users.findOne(query, {fields: {_id:1}});
      return found ? true : false;
    },
    /**
     * Gets all of the users that are directly a part of the list of teams.
     *
     * @method getDirectMembersOfTeams
     * @param {Array} teamNames - Name(s) of team(s) that you wish to find all
     * of the users of
     * @return {Array} All user ids directly associated with the teams
    */
    getDirectMembersOfTeams: function(teamNames) {
      if (!_.isArray(teamNames)) teamNames = [teamNames];
      let response = [];

      _.each(teamNames, (teamName) => {
        let query = {};
        query['teams.' + teamName] = {$exists:true};

        response = response.concat(Meteor.users.find(query, {fields: {_id: 1}}).fetch());
      });

      return _.uniq(response);
    },
    /**
     * Gets all of the users that are directly and indirectly associated with
     * the provided teams. Not yet implemented.
     *
     * @method getAllMembersOfTeams
     * @param {Array} teamNames - Name(s) of team(s) that you wish to find all
     * of the users of
     * @return {Array} All user ids directly associated with the teams
    */
    getAllMembersOfTeam: function(teamName) {
      if (!teamName) return [];
      throw new Error("This function is not yet implemented");
      return false;
    },
    /**
     * Gets the highest level parent of the provided team.
     *
     * @method getTopLevelTeam
     * @param {Array} teamName - Name of the team whose top most parent you wish
     * to find
     * @return {Object} The top most parent of the provided team
    */
    getTopLevelTeam: function(teamName) {
      return Meteor.teams.findOne({ name: teamName, path: ''});
    },
    /**
     * Gets a list of all of the top most teams.
     *
     * @method getAllTopLevelTeams
     * @return {Array} All teams without parents
    */
    getAllTopLevelTeams: function() {
      return Meteor.teams.find({path: { $eq: '' }}).fetch();
    },
    /**
     * Gets all of the teams currently being tracked. Sorted alphabetically.
     *
     * @method getAllTeams
     * @return {Array} All team objects that are being tracked in the database
    */
    getAllTeams: function() {
      return Meteor.teams.find({}, {sort: {name:1}});
    },
    /**
     * Gets a list of the roles that a particular user has in a team.
     *
     * @method getRolesInTeamForUser
     * @param {String} user - Id of the user whose roles you wish to retrieve
     * @param {String} team - The name of the team you wish to check the user
     * against
     * @return {Array} All roles associated with a user in the passed in team
    */
    getRolesInTeamForUser: function(user, team) {
      if (!user) return [];
      if (!team) return [];

      if ('string' === typeof user) {
         user = Meteor.users.findOne(
                  {_id: user},
                  {fields: {teams:1}});
      } else if ('object' !== typeof user) {
        //invalid user object
        return [];
      }

      //User has no teams
      if (!user || !user.teams || _.isArray(user.teams)) return [];

      return user.teams[team];
    },
    /**
     * Gets all of the names of the user's associated teams. If a specific role
     * is provided, then only the team names that the user has that role in will
     * be returned.
     *
     * @method getTeamNamesForUser
     * @param {Array} user - The id of the user whose teams you wish to retrieve
     * @param {String} role - Optional: return only the teams that the user has
     * this role in
     * @return {Array} All the team objects that the user is associated with, if
     * a role is provided then only the team objects that the user has that role
     * in
    */
    getTeamNamesForUser: function(user, role) {
      return Object.keys(Teams.getTeamsForUser(user, role));
    },
    /**
     * Gets all of the user's associated teams as objects. If a specific role is
     * provided, then only the teams that the user has that role in will be
     * returned.
     *
     * @method getTeamsForUser
     * @param {Array} user - The id of the user whose teams you wish to retrieve
     * @param {String} role - Optional: return only the teams that the user has
     * this role in
     * @return {Array} All the team objects that the user is associated with, if
     * a role is provided then only the team objects that the user has that role
     * in
    */
    getTeamsForUser: function(user, role) {
      var userTeams = [];

      if (!user) return [];
      if (role) {
        if ('string' === typeof role) return [];
        if ('$' === role[0]) return [];

        //convert any periods to underscores
        role = role.replace('.', '_');
      }

      if ('string' === typeof user) {
         user = Meteor.users.findOne(
                  {_id: user},
                  {fields: {teams:1}});
      } else if ('object' !== typeof user) {
        //invalid user object
        return [];
      }

      //User has no teams
      if (!user || !user.teams || _.isArray(user.teams)) return [];

      if (role) {
        _.each(user.teams, (teamRoles, teamName) => {
          if (_.contains(teamRoles, role)) {
            userTeams.push(teamName);
          }
        });
        return userTeams;
      } else {
        return user.teams;//_.without(_.keys(user.teams)
      }
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
     _update_$set_fn: function (team, roles) {
       var update = {};

       update.$set = {};
       update.$set['teams.' + team] = _.without(roles, null);

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
      _update_$addToSet_fn: function(team, roles) {
        var update = {};

        update.$addToSet = {};
        update.$addToSet['teams.' + team] = {$each: _.without(roles, null)};

        return update;
      },
      /*_updateMulti_$addToSet_fn: function(teams) {
        var update = {};

        update.$addToSet = {};
        update.$addToSet
      }*/
      _updateUserTeams: function(users, teams, roles, updateFactory) {
        if (!users) throw new Error("Missing 'users' param");
        if (!teams) throw new Error("Missing 'teams' param");

        var existingTeams,
            query,
            update;

        //ensure arrays to simplify code
        if (!_.isArray(users)) users = [users];
        if (!_.isArray(teams)) teams = [teams];
        if (!_.isArray(roles)) roles = [roles];

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

        //update per Team *make this better*
        _.each(teams, (team) => {
          //update all users
          update = updateFactory(team, roles);

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
            console.log(ex);
            throw ex;
          }
        });
      }//end _updateUserTeams
}); //end _.extend(Teams ...)
}());
