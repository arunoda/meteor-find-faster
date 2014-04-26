var Future = Npm.require('fibers/future');
var cursorProto = getCursorProto();
var lastTimeObserverUsed = {};
var keepHandles = {};

var originalFetch = cursorProto.fetch;
cursorProto.fetch = function() {
  if(this._cursorDescription.options.smart) {
    // console.log('YES');
    return fetchSmartly(this);
  } else {
    // console.log('NO');
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

  // var docs = [];
  // var handle = cursor.observe({
  //   added: function(doc) {
  //     docs.push(doc);
  //   }
  // });
  // handle.stop();

  var multiplexer = keepHandles[observeKey]._multiplexer;
  var f = new Future();
  multiplexer._queue.runTask(function() {
    var handlerDocs = multiplexer._cache.docs;
    var docs = [];
    for(var key in handlerDocs) {
      docs[key] =  EJSON.clone(handlerDocs[key]);
    }
    f.return(docs);
  });
  return f.wait();
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