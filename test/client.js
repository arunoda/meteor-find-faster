Tinytest.addAsync('Client - findFaster', function(test, done) {
  var coll = new Meteor.Collection(null);
  var doc = {_id: "aa", aa: 10};
  coll.insert(doc);

  var data = coll.findFaster().fetch();
  test.equal(data, [doc]);
  done();
});

Tinytest.addAsync('Client - findOneFaster', function(test, done) {
  var coll = new Meteor.Collection(null);
  var doc = {_id: "aa", aa: 10};
  coll.insert(doc);

  var data = coll.findOneFaster();
  test.equal(data, doc);
  done();
});