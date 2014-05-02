var cursorProto = FindFaster._getCursorProto();
var collectionProto = Meteor.Collection.prototype;

//fetch
var originalFetch = cursorProto.fetch;
cursorProto.fetch = function() {
  if(FindFaster._canUseFindFaster(this)) {
    return FindFaster._fetch(this);
  } else {
    return originalFetch.apply(this, arguments);
  }
};

//forEach
var originalForEach = cursorProto.forEach;
cursorProto.forEach = function(callback, thisArg) {
  if(FindFaster._canUseFindFaster(this)) {
    var docs = FindFaster._fetch(this);
    var cursor = this;

    docs.forEach(function(doc, index) {
      callback.call(thisArg, doc, index, cursor);
    });
  } else {
    return originalForEach.apply(this, arguments);
  }
};

// Map
var originalMap = cursorProto.map;
cursorProto.map = function(callback, thisArg) {
  if(FindFaster._canUseFindFaster(this)) {
    var result = [];
    var cursor = this;

    var docs = FindFaster._fetch(this);
    docs.forEach(function(doc, index) {
      result.push(callback.call(thisArg, doc, index, cursor));
    });
    return result;
  } else {
    return originalMap.call(this, callback, thisArg);
  }
};

// Extending Meteor.Collection
collectionProto.findFaster = function(selector, options) {
  var args = _.toArray(arguments);
  selector = this._getFindSelector(args)
  options = this._getFindOptions(args)

  options.findFaster = true;
  return this.find(selector, options);
};

collectionProto.findOneFaster = function(selector, options) {
  var args = _.toArray(arguments);
  selector = this._getFindSelector(args)
  options = this._getFindOptions(args)

  options.findFaster = true;
  // this is need since, Meteor rejects to use oplog
  // if there is no sort specifier
  options.sort = options.sort || {_id: 1};
  return this.findOne(selector, options);
};
