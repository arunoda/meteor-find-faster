CreateCollection = function() {
  return new Meteor.Collection('coll-' + Random.id());
}