Tinytest.addAsync('DB Opeations - sort', function(test, done) {
  var coll = CreateCollection();
  coll.insert({_id: "aa", aa: 10})
  coll.insert({_id: "bb", aa: 20})
  coll.insert({_id: "cc", aa: 15})

  var cursor = coll.find({}, {sort: {aa: -1}, findFaster: true});
  // to test the fastRead usage,
  cursor.fetch(); 
  test.equal(cursor.fetch(), [
    {_id: "bb", aa: 20}, 
    {_id: "cc", aa: 15}, 
    {_id: "aa", aa: 10}
  ]);
  done();
});

Tinytest.addAsync('DB Opeations - sort & limit', function(test, done) {
  var coll = CreateCollection();
  coll.insert({_id: "aa", aa: 10})
  coll.insert({_id: "bb", aa: 20})
  coll.insert({_id: "cc", aa: 15})

  var cursor = coll.find({}, {sort: {aa: -1}, limit: 2, findFaster: true});
  cursor.fetch();
  test.equal(cursor.fetch(), [
    {_id: "bb", aa: 20}, 
    {_id: "cc", aa: 15}
  ]);
  done();
});

Tinytest.addAsync('DB Opeations - field filtering', function(test, done) {
  var coll = CreateCollection();
  coll.insert({_id: "aa", aa: 10})
  coll.insert({_id: "bb", aa: 20})
  coll.insert({_id: "cc", aa: 15})

  var cursor = coll.find({}, {
    fields: {aa: 0}, 
    sort: {aa: -1},
    findFaster: true
  });
  cursor.fetch();
  test.equal(cursor.fetch(), [
    {_id: "bb"}, 
    {_id: "cc"},
    {_id: "aa"}
  ]);
  done();
});

Tinytest.addAsync('DB Opeations - trasnforming', function(test, done) {
  var coll = CreateCollection();
  coll.insert({_id: "aa", aa: 10})
  coll.insert({_id: "bb", aa: 20})
  coll.insert({_id: "cc", aa: 15})

  var cursor = coll.find({}, {
    fields: {aa: 0}, 
    sort: {aa: -1},
    transform: function(doc) {
      doc.edited = true;
      return doc;
    },
    findFaster: true
  });
  cursor.fetch();
  test.equal(cursor.fetch(), [
    {_id: "bb", edited: true}, 
    {_id: "cc", edited: true},
    {_id: "aa", edited: true}
  ]);
  done();
});

Tinytest.addAsync('DB Opeations - trasnforming - collection level', function(test, done) {
  var coll = new Meteor.Collection('_colll-' + Random.id(), {
    transform: function(doc) {
      doc.edited = true;
      return doc;
    }
  });
  coll.insert({_id: "aa", aa: 10})
  coll.insert({_id: "bb", aa: 20})
  coll.insert({_id: "cc", aa: 15})

  var cursor = coll.find({}, {
    fields: {aa: 0}, 
    sort: {aa: -1},
    findFaster: true
  });
  cursor.fetch();
  test.equal(cursor.fetch(), [
    {_id: "bb", edited: true}, 
    {_id: "cc", edited: true},
    {_id: "aa", edited: true}
  ]);
  done();
});

Tinytest.addAsync('DB Opeations - disable trasnforming - collection level;', function(test, done) {
  var coll = new Meteor.Collection('_colll-' + Random.id(), {
    transform: function(doc) {
      doc.edited = true;
      return doc;
    }
  });
  coll.insert({_id: "aa", aa: 10})
  coll.insert({_id: "bb", aa: 20})
  coll.insert({_id: "cc", aa: 15})

  var cursor = coll.find({}, {
    fields: {aa: 0}, 
    sort: {aa: -1},
    findFaster: true,
    transform: null
  });
  cursor.fetch();
  test.equal(cursor.fetch(), [
    {_id: "bb"}, 
    {_id: "cc"},
    {_id: "aa"}
  ]);
  done();
});
