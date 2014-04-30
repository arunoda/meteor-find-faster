Tinytest.addAsync('fetch - simple fetch', function(test, done) {
  var coll = CreateCollection();
  var docs = [{_id: 'aaa', aa: 10}]
  coll.insert(docs[0]);
  var cursor = coll.find({}, {findFaster: true});
  // test.equal(FindFaster._canUseFindFaster(cursor), true);

  var fetchedDocs = cursor.fetch();
  test.equal(fetchedDocs, docs)
  done();
});

// Tinytest.addAsync('fetch - using expectedDocs', function(test, done) {
//   var coll = CreateCollection();
//   var docs = [{_id: 'aaa', aa: 10}, {_id: 'bbb', aa: 10}]
//   coll.insert(docs[0]);
//   var cursor = coll.find({}, {findFaster: true});
//   test.equal(FindFaster._canUseFindFaster(cursor), true);
  
//   var fetchedDocs = cursor.fetch();
//   test.equal(fetchedDocs[0], docs[0])

//   // insert again
//   coll.insert(docs[1]);

//   fetchedDocs2 = coll.find({}, {findFaster: true, expectedDocs: 2}).fetch();
//   test.equal(fetchedDocs2, docs);
//   done();
// });

// Tinytest.addAsync('fetch - using expectedDocs globally', function(test, done) {
//   var coll = CreateCollection();
//   var docs = [{_id: 'aaa', aa: 10}, {_id: 'bbb', aa: 10}]
//   coll.insert(docs[0]);
//   var cursor = coll.find({}, {findFaster: true});
//   test.equal(FindFaster._canUseFindFaster(cursor), true);
  
//   var fetchedDocs = cursor.fetch();
//   test.equal(fetchedDocs[0], docs[0])

//   // insert again
//   coll.insert(docs[1]);

//   FindFaster.defaultExpectedDocs =2;
//   fetchedDocs = coll.find({}, {findFaster: true}).fetch();
//   test.equal(fetchedDocs, docs);
//   done();
// });

// Tinytest.addAsync('fetch - using expectedDocs EnvironmentVariable', function(test, done) {
//   var coll = CreateCollection();
//   var docs = [{_id: 'aaa', aa: 10}, {_id: 'bbb', aa: 10}]
//   coll.insert(docs[0]);
//   var cursor = coll.find({}, {findFaster: true});
//   test.equal(FindFaster._canUseFindFaster(cursor), true);
  
//   var fetchedDocs = cursor.fetch();
//   test.equal(fetchedDocs[0], docs[0])

//   // insert again
//   coll.insert(docs[1]);

//   var fetchedDocs = FindFaster.expectedDocs.withValue(2, function() {
//     return coll.find({}, {findFaster: true}).fetch();
//   });

//   test.equal(fetchedDocs, docs);
//   done();
// });