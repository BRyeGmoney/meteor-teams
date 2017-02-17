[![Build Status](https://travis-ci.org/BRyeGmoney/meteor-teams.svg?branch=master)](https://travis-ci.org/BRyeGmoney/meteor-teams)

## Base: ##

This package is definitely based on the same ideas as alanning:roles but with teams (aka groups) taking center stage. This allows me to use mongo's materialized paths pattern to allow for a hierarchy between teams.

## INFO: ##

Using this package, you can create multi-tiered organizations that users can be a part of. Each team has its own specific set of roles that are assigned loosely to users. Maybe in the future
it'll turn out that enforcing these more strictly will be a good idea, but for now its your own fault if you have one user with role: admin and another with role:adin and you can't get the
second guy to see stuff he should.

## Installing: ##

1. Add one of the built-in accounts packages so the Meteor.users collection exists
```bash
meteor add accounts-password
```

2. Install the meteor teams package to your project directory
```bash
meteor add bgromadzki:meteor-teams
```

3. Run the application
```bash
meteor
```

## Basic Usage: ##

To be able to associate a user with a team, we need to have the team created:

```js
  Teams.createTeam('teamA');
```

Now lets place two of our users into this newly created team:

```js
  Teams.addUsersToTeams([users.bugs, users.daffy], ['teamA']);
```

A team isn't an industrial era style team if there isn't a slave driver, so lets choose one of our users to be the driver:

```js
  Teams.addUsersToRolesInTeams(users.bugs, ["slave_drivers"], 'teamA');
```

If a user is a driver, then they should be able to hold the whip, no?

```js
  if (Teams.userHasRolesInTeams(users.bugs, ["slave_drivers"], 'teamA')) {
    giveWhip(users.bugs);
  }
```

## NOTE (v0.3.0): ##

There have been a few slight changes in semantics to clarify the functionality of certain methods, as well as to ensure consistent parameters.

The following function names have been changed:

```js
  addUsersToRolesInTeam -> addUsersToRolesInTeams
  userBelongsToTeam     -> userBelongsToTeams
  userHasRolesInTeam    -> userHasRolesInTeams
```

The following functions have parameter order changed:

```js
  removeUsersFromRolesInTeams(users, teams, roles) -> removeUsersFromRolesInTeams(users, roles, teams)
```

The following functions have been added:

```js
  setUsersRolesInTeams(users, roles, teams)
```

## FUTURE UPDATES: ##

* Remove need for unique team names, i should be able to have Dog Lovers->owners and Cat Lovers->owners without them stepping on each other's toes
* Feel free to shoot me a message on github/open an issue/whatever for anything you think needs to be in this package
