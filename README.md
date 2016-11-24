[![Build Status](https://travis-ci.org/BRyeGmoney/meteor-teams.svg?branch=master)](https://travis-ci.org/BRyeGmoney/meteor-teams)

## INFO:
This package is definitely based on the same ideas as alanning:roles but with teams (aka groups) taking center stage. This allows me to use mongo's materialized paths pattern to allow for a hierarchy between teams.

Using this package, you can create multi-tiered organizations that users can be a part of. Each team has its own specific set of roles that are assigned loosely to users. Maybe in the future
it'll turn out that enforcing these more strictly will be a good idea, but for now its your own fault if you have one user with role: admin and another with role:adin and you can't get the
second guy to see stuff he should. 

## NOTE:
I, for some reason, replaced spaces with underscores in previous versions when creating a team. This meant that Dog Owner's Club would be inserted into the db as Dog_Owner\'s_Club and when
I tried inserting roles into a user on a team, it would search the db for Dog Owner's Club but not find it, then try to create the team and be going in as Dog_Owner\'s_Club, which already
exists, which would throw an error.

Anything you have currently should work just fine, but any future entries will be in the db as you have them written.


## FUTURE UPDATES:
-Better documentation
-Remove need for unique team names, i should be able to have Dog Lovers->owners and Cat Lovers->owners without them stepping on each other's toes
-Feel free to shoot me a message on github/open an issue/whatever for anything you think needs to be in this package

## 0.2.6 Functions Supported:
* createTeam(team [, owningTeam])
* deleteTeam(team)
* addUsersToRolesInTeam(users, roles, team)
* addUsersToTeams(users, teams)
* setUserTeams(users, teams)
* removeUsersFromRolesInTeams(users, teams, roles)
* removeUsersFromTeams(users, teams)
* userBelongsToTeam(user, teams)
* userHasRolesInTeam(user, roles, teams)
* userIsInTeam(user, teams)
* getDirectMembersOfTeams(teams)
* getAllTeamsUnderTeam(team)
* getTeamNamesForUser(user [, role])
* getTeamsForUser(user [, role])
* getRolesInTeamForUser(user, team)
* getAllTeams()
* getAllTopLevelTeams()
* getTopLevelTeam(team)
