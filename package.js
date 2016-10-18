Package.describe({
  name: 'bgromadzki:meteor-teams',
  version: '0.0.2',
  // Brief, one-line summary of the package.
  summary: 'Additional "hierarchy" style authorization (using mongo materialized paths pattern) features built on the roles package',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/BRyeGmoney/meteor-teams.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  var both = ['client', 'server'];

  api.versionsFrom('METEOR@1.4.1.2');

  api.use(['ecmascript',
           'underscore',
           'accounts-base',
           'mongo',
           'tracker',
           'check'], both);

  api.use(['blaze'], 'client', {weak: true});

  api.export('Teams');

  api.addFiles('teams_server.js', 'server');
  api.addFiles('teams_common.js', both);
  api.addFiles(['client/debug.js',
                'client/uiHelpers.js',
                'client/subscriptions.js'], 'client');
});

Package.onTest(function(api) {
  var both = ['client', 'server'];

  api.use(['bgromadzki:meteor-teams',
           'accounts-password@1.2.12',
           'underscore',
           'tinytest'], both);
  //api.mainModule('meteor-teams-tests.js');
  api.addFiles('tests/client.js', 'client');
  api.addFiles('tests/server.js', 'server');
});
