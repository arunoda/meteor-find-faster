Package.describe({
  "summary": "Improving MongoDB Read Performance"
});

Package.on_use(function(api) {
  api.use(['livedata', 'mongo-livedata', 'random', 'minimongo', 'underscore'], ['server']);

  api.add_files([
    'lib/fast_read.js',
    'lib/override.js',
  ], 'server');  

  api.export('FastRead', ['server']);
});

Package.on_test(function(api) {
  api.use(['livedata', 'mongo-livedata', 'random', 'minimongo', 'underscore'], ['server']);
  api.use(['tinytest'], ['server'])
  api.add_files([
    'lib/fast_read.js',
    'lib/override.js',

    'test/helpers.js',
    'test/can_use_fast_read.js',
    'test/fetch.js'
  ], 'server');  
});