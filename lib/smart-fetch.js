var cursorProto = getCursorProto();
var lastTimeObserverUsed = {};
var keepHandles = {};

var originalFetch = cursorProto.fetch;
cursorProto.fetch = function() {
  if(this._cursorDescription.options.smart) {
    return fetchSmartly(this);
  } else {
    return originalFetch.apply(this, arguments);
  }
};

function fetchSmartly(cursor) {
  var observeKey = JSON.stringify(_.extend({ordered: false}, cursor._cursorDescription));

  if(!lastTimeObserverUsed[observeKey]) {
    keepHandles[observeKey] = cursor.observeChanges({added: function() {}}); 
    timeoutKeepObserver(cursor, observeKey);
  }
  
  lastTimeObserverUsed[observeKey] = Date.now();

  var docs = [];
  var multiplexer = keepHandles[observeKey]._multiplexer;
  // need to run inside a queue, since there might be some
  // write ops, which have not been completed yet
  multiplexer._queue.runTask(function() {
    multiplexer._cache.docs.forEach(function(doc) {
      docs.push(EJSON.clone(doc));
    });
  });
  return docs;
}

function timeoutKeepObserver(cursor, observeKey) {
  var lastTimeObserved = lastTimeObserverUsed[observeKey] || Date.now();
  var timeoutValue = (lastTimeObserved + (5 * 1000)) - Date.now();

  if(timeoutValue > 0) {
    setTimeout(function() {
      timeoutKeepObserver(cursor, observeKey);
    }, timeoutValue);
  } else {
    keepHandles[observeKey].stop();
    keepHandles[observeKey] = null;
    lastTimeObserverUsed[observeKey] = null;
  }
}

function getCursorProto() {
  var coll = new Meteor.Collection('__dummy_collection_' + Random.id());
  var cursor = coll.find();
  return cursor.constructor.prototype;
}