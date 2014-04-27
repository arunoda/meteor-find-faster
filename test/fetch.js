Tinytest.addAsync('fetch - simple fetch', function(test, done) {
  var coll = CreateCollection();
  var docs = [{_id: 'aaa', aa: 10}]
  coll.insert(docs[0]);
  var cursor = coll.find({}, {fastRead: true});
  test.equal(FastRead._canUseFastRead(cursor), true);

  var fetchedDocs = cursor.fetch();
  test.equal(fetchedDocs, docs)
  done();
});

Tinytest.addAsync('fetch - using expectedDocs', function(test, done) {
  var coll = CreateCollection();
  var docs = [{_id: 'aaa', aa: 10}, {_id: 'bbb', aa: 10}]
  coll.insert(docs[0]);
  var cursor = coll.find({}, {fastRead: true});
  test.equal(FastRead._canUseFastRead(cursor), true);
  
  var fetchedDocs = cursor.fetch();
  test.equal(fetchedDocs[0], docs[0])

  // insert again
  coll.insert(docs[1]);

  fetchedDocs2 = coll.find({}, {fastRead: true, expectedDocs: 2}).fetch();
  test.equal(fetchedDocs2, docs);
  done();
});

Tinytest.addAsync('fetch - using expectedDocs globally', function(test, done) {
  var coll = CreateCollection();
  var docs = [{_id: 'aaa', aa: 10}, {_id: 'bbb', aa: 10}]
  coll.insert(docs[0]);
  var cursor = coll.find({}, {fastRead: true});
  test.equal(FastRead._canUseFastRead(cursor), true);
  
  var fetchedDocs = cursor.fetch();
  test.equal(fetchedDocs[0], docs[0])

  // insert again
  coll.insert(docs[1]);

  FastRead.defaultExpectedDocs =2;
  fetchedDocs = coll.find({}, {fastRead: true}).fetch();
  test.equal(fetchedDocs, docs);
  done();
});

Tinytest.addAsync('fetch - using expectedDocs EnvironmentVariable', function(test, done) {
  var coll = CreateCollection();
  var docs = [{_id: 'aaa', aa: 10}, {_id: 'bbb', aa: 10}]
  coll.insert(docs[0]);
  var cursor = coll.find({}, {fastRead: true});
  test.equal(FastRead._canUseFastRead(cursor), true);
  
  var fetchedDocs = cursor.fetch();
  test.equal(fetchedDocs[0], docs[0])

  // insert again
  coll.insert(docs[1]);

  var fetchedDocs = FastRead.expectedDocs.withValue(2, function() {
    return coll.find({}, {fastRead: true}).fetch();
  });

  test.equal(fetchedDocs, docs);
  done();
});