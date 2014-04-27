Tinytest.addAsync('canUseFastRead - no option passed', function(test, done) {
  var coll = CreateCollection();
  var cursor = coll.find({});

  test.equal(FastRead._canUseFastRead(cursor), false);
  done();
});

Tinytest.addAsync('canUseFastRead - option passed', function(test, done) {
  var coll = CreateCollection();
  var cursor = coll.find({}, {fastRead: true});

  test.equal(FastRead._canUseFastRead(cursor), true);
  done();
});

Tinytest.addAsync('canUseFastRead - oplog supported query', function(test, done) {
  var coll = CreateCollection();
  var cursor = coll.find({aa: 10}, {sort: {aa: 1}, limit: 10, fastRead: true});

  test.equal(FastRead._canUseFastRead(cursor), true);
  done();
});

Tinytest.addAsync('canUseFastRead - query not supported by oplog', function(test, done) {
  var coll = CreateCollection();
  var cursor = coll.find({aa: 10}, {limit: 10, fastRead: true});

  test.equal(FastRead._canUseFastRead(cursor), false);
  done();
});