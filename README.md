[![Build Status](https://travis-ci.org/BRyeGmoney/meteor-teams.svg?branch=master)](https://travis-ci.org/BRyeGmoney/meteor-teams)

This package is definitely based on the same ideas as alanning:roles but with teams "groups" taking center stage. This allows me to use mongo's materialized paths pattern to allow for a hierarchy between teams.

0.2.1 Functions Supported:
* createTeam(team [, owningTeam])
* deleteTeam(team)
* addUsersToRolesInTeam(users, roles, team)
* addUsersToTeams(users, teams)
* setUserTeams(users, teams)
* removeUsersFromRolesInTeams(users, teams, roles)
* removeUsersFromTeams(users, teams)
* getPathForTeam(teamName)
* getFullPathForTeam(teamName)
* getAllTeamsUnderTeam(team)
* getUserBelongsToTeam(user, teams)
* getUserIsInTeam(user, teams)
* getTeamNamesForUser(user [, role])
* getTeamsForUser(user [, role])
* getRolesInTeamForUser(user, team)
* getAllTeams()

0.0.2 Supports:
-Adding and deleting teams
-Adding hierarchy to teams
-All team names must be unique
-Checking if a user is in a team
-Checking if a user belongs to a team down stream
