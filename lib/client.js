var collectionProto = Meteor.Collection.prototype;

collectionProto.findFaster = collectionProto.find;
collectionProto.findOneFaster = collectionProto.findOne;