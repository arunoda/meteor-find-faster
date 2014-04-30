Package.describe({
  "summary": "Ultra Fast Implementation for Meteor's Collection.find()"
});

Package.on_use(function(api) {
  api.use(['livedata', 'mongo-livedata', 'random', 'minimongo', 'underscore'], ['server']);

  api.add_files([
    'lib/find_faster.js',
    'lib/override.js',
  ], 'server');  

  api.export('FastRead', ['server']);
});

Package.on_test(function(api) {
  api.use(['livedata', 'mongo-livedata', 'random', 'minimongo', 'underscore'], ['server']);
  api.use(['tinytest'], ['server'])
  api.add_files([
    'lib/find_faster.js',
    'lib/override.js',

    'test/helpers.js',
    'test/can_use_fast_read.js',
    'test/fetch.js',
    'test/db_operations.js'
  ], 'server');  
});