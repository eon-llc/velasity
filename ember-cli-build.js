'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    sassOptions: {
      extension: 'sass',
    },
    'ember-bootstrap': {
      bootstrapVersion: 4,
      importBootstrapCSS: false,
      whitelist: ['bs-tooltip'],
    },
    'ember-cli-page-progress': {
      includeCss: false,
    },
    'ember-composable-helpers': {
      only: ['object-at'],
    },
    'ember-mdi': {
      icons: ['heart', 'star', 'star-four-points', 'content-copy', 'information', 'twitter'],
    },
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  return app.toTree();
};
