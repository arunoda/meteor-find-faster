Package.describe({
  "summary": "Faster & Efficient Implementation of Meteor's Collection.find()"
});

Package.on_use(function(api) {
  api.use(['livedata', 'mongo-livedata', 'random', 'minimongo', 'underscore'], ['server']);

  api.add_files([
    'lib/server.js',
    'lib/override.js',
  ], 'server');  

  api.add_files([
    'lib/client.js',
  ], 'client'); 

  api.export('FastRead', ['server']);
});

Package.on_test(function(api) {
  api.use(['livedata', 'mongo-livedata', 'random', 'minimongo', 'underscore'], ['server']);
  api.use(['tinytest'], ['server', 'client'])
  api.add_files([
    'lib/server.js',
    'lib/override.js',

    'test/helpers.js',
    'test/can_use_fast_read.js',
    'test/fetch.js',
    'test/db_operations.js'
  ], 'server');

  api.add_files([
    'lib/client.js',
    'test/client.js',
  ], 'client');   
});