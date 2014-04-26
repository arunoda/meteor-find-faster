var fs = Npm.require('fs');
var path = Npm.require('path');

Package.describe({
  "summary": "Improving MongoDB Read Performance"
});

Package.on_use(function(api) {
  api.use(['livedata', 'mongo-livedata', 'random'], ['server']);

  api.add_files([
    'lib/smart-fetch.js',
  ], 'server');  
});
