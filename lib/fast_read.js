FastRead = {};

FastRead._dummyColl = new Meteor.Collection('__dummy_collection_' + Random.id());
FastRead._lastTimeObserverUsed = {};
FastRead._keepHandles = {};

FastRead._getCursorProto = _.once(getCursorProto);
FastRead._getObserveDriverClass = _.once(getObserveDriverClass);
FastRead._fetch = fetch;
FastRead._canUseFastRead = canUseFastRead;
FastRead._getExpectedDocs = getExpectedDocs;

FastRead.defaultExpectedDocs  = 1;
FastRead.expectedDocs = new Meteor.EnvironmentVariable();
FastRead.timeout = 5 * 1000

function canUseFastRead(cursor) {
  var condition = 
    cursor._cursorDescription.options.fastRead &&
    cursor._mongo._oplogHandle &&
    canUseOplog(cursor._cursorDescription, FastRead._getObserveDriverClass());

  return !!condition;
}

function canUseOplog(cursorDescription, OplogObserveDriver) {
  var matcher;
  var sorter;

  // stolen and modified from Meteor's mongo-livedata
  var canUseOplog = _.all([
    function () {
      // We need to be able to compile the selector. Fall back to polling for
      // some newfangled $selector that minimongo doesn't support yet.
      try {
        matcher = new Minimongo.Matcher(cursorDescription.selector);
        return true;
      } catch (e) {
        // XXX make all compilation errors MinimongoError or something
        //     so that this doesn't ignore unrelated exceptions
        return false;
      }
    }, function () {
      // ... and the selector itself needs to support oplog.
      return OplogObserveDriver.cursorSupported(cursorDescription, matcher);
    }, function () {
      // And we need to be able to compile the sort, if any.  eg, can't be
      // {$natural: 1}.
      if (!cursorDescription.options.sort)
        return true;
      try {
        sorter = new Minimongo.Sorter(cursorDescription.options.sort,
                                      { matcher: matcher });
        return true;
      } catch (e) {
        // XXX make all compilation errors MinimongoError or something
        //     so that this doesn't ignore unrelated exceptions
        return false;
      }
    }], function (f) { return f(); });  // invoke each function

  return canUseOplog;
}

function getCursorProto() {
  var cursor = FastRead._dummyColl.find();
  return cursor.constructor.prototype;
};

function getObserveDriverClass() {
  var handle = FastRead._dummyColl.find().observeChanges({
    added: function() {}
  });
  
  var driver = handle._multiplexer._observeDriver.constructor;
  handle.stop();

  return driver;
}

function fetch(cursor, dontClone) {
  var observeKey = JSON.stringify(_.extend({ordered: false}, cursor._cursorDescription));

  if(!FastRead._lastTimeObserverUsed[observeKey]) {

    // creating a new cursor with removing fastRead option to avoid locking
    // and using fastRead inside the observeChanges
    var cursorDescription = EJSON.clone(cursor._cursorDescription);
    delete cursorDescription.options.fastRead;
    var newCursor = new (cursor.constructor)(cursor._mongo, cursorDescription);
    FastRead._keepHandles[observeKey] = newCursor.observeChanges({added: function() {}}); 

    timeoutKeepObserver(cursor, observeKey);
  }
  
  FastRead._lastTimeObserverUsed[observeKey] = Date.now();
  // since fastRead is eventual consistancy
  // asking expectedDocs values makes us to make fastRead closer
  // to strong consistancy for simple fetchs like _id
  var expectedDocs = FastRead._getExpectedDocs(cursor);

  var multiplexer = FastRead._keepHandles[observeKey]._multiplexer;
  var docs = getDocsFromMultiflexer(multiplexer, dontClone);
  
  if(docs.length >= expectedDocs) {
    return docs;
  } else {
    cursor._mongo._oplogHandle.waitUntilCaughtUp();
    return getDocsFromMultiflexer(multiplexer, dontClone);
  }
}

function getDocsFromMultiflexer(multiplexer, dontClone) {
  var docs = [];
  multiplexer._queue.runTask(function() {
    // when we just need docs to count it
    if(dontClone) {
      docs = multiplexer._cache.docs;
    } else {
      multiplexer._cache.docs.forEach(function(doc) {
        docs.push(EJSON.clone(doc));
      });
    }
  });
  return docs;
}

function getExpectedDocs(cursor) {
  if(cursor._cursorDescription.options.expectedDocs) {
    return cursor._cursorDescription.options.expectedDocs;
  } else if(FastRead.expectedDocs.get()) {
    return FastRead.expectedDocs.get();
  } else {
    return FastRead.defaultExpectedDocs;
  }
}

function timeoutKeepObserver(cursor, observeKey) {
  var lastTimeObserved = FastRead._lastTimeObserverUsed[observeKey] || Date.now();
  var timeoutValue = (lastTimeObserved + FastRead.timeout) - Date.now();

  if(timeoutValue > 0) {
    setTimeout(function() {
      timeoutKeepObserver(cursor, observeKey);
    }, timeoutValue);
  } else {
    FastRead._keepHandles[observeKey].stop();
    FastRead._keepHandles[observeKey] = null;
    FastRead._lastTimeObserverUsed[observeKey] = null;
  }
}