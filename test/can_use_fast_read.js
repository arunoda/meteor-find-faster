Tinytest.addAsync('canUseFindFaster - no option passed', function(test, done) {
  var coll = CreateCollection();
  var cursor = coll.find({});

  test.equal(FindFaster._canUseFindFaster(cursor), false);
  done();
});

Tinytest.addAsync('canUseFindFaster - option passed', function(test, done) {
  var coll = CreateCollection();
  var cursor = coll.find({}, {findFaster: true});

  test.equal(FindFaster._canUseFindFaster(cursor), true);
  done();
});

Tinytest.addAsync('canUseFindFaster - oplog supported query', function(test, done) {
  var coll = CreateCollection();
  var cursor = coll.find({aa: 10}, {sort: {aa: 1}, limit: 10, findFaster: true});

  test.equal(FindFaster._canUseFindFaster(cursor), true);
  done();
});

Tinytest.addAsync('canUseFindFaster - query not supported by oplog', function(test, done) {
  var coll = CreateCollection();
  var cursor = coll.find({aa: 10}, {limit: 10, findFaster: true});

  test.equal(FindFaster._canUseFindFaster(cursor), false);
  done();
});