FindFaster = {};

FindFaster._dummyColl = new Meteor.Collection('__dummy_collection_' + Random.id());
FindFaster._lastTimeObserverUsed = {};
FindFaster._keepHandles = {};

FindFaster._getCursorProto = _.once(getCursorProto);
FindFaster._getOplogObserveDriverClass = _.once(getOplogObserveDriverClass);
FindFaster._fetch = fetch;
FindFaster._canUseFindFaster = canUseFindFaster;
FindFaster._getExpectedDocs = getExpectedDocs;

FindFaster.defaultExpectedDocs  = 1;
FindFaster.expectedDocs = new Meteor.EnvironmentVariable();
FindFaster.timeout = 5 * 1000;

function canUseFindFaster(cursor) {
  var condition = 
    cursor._cursorDescription.options.findFaster &&
    FindFaster._getOplogObserveDriverClass() && 
    canUseOplog(cursor._cursorDescription, FindFaster._getOplogObserveDriverClass());

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
  // allow Meteor to connect to Mongo and initialze the connection
  FindFaster._dummyColl.findOne();
  var cursor = FindFaster._dummyColl.find();
  return cursor.constructor.prototype;
};

function getOplogObserveDriverClass() {
  var cursor = FindFaster._dummyColl.find();
  if(cursor._mongo._oplogHandle) {
    // we need to waitUntil, oplog driver gets initialized
    // otherwise we counldn't get the OplogDriver
    cursor._mongo._oplogHandle.waitUntilCaughtUp();
    var handle = FindFaster._dummyColl.find({}).observeChanges({
      added: function() {}
    });
    
    var driverClass = handle._multiplexer._observeDriver.constructor;
    handle.stop();

    return driverClass;
  }
}

function fetch(cursor, dontClone) {
  var observeKey = JSON.stringify(_.extend({ordered: false}, cursor._cursorDescription));

  if(!FindFaster._lastTimeObserverUsed[observeKey]) {
    // creating a new cursor with removing FindFaster option to avoid locking
    // and using FindFaster inside the observeChanges
    var cursorDescription = EJSON.clone(cursor._cursorDescription);
    delete cursorDescription.options.findFaster;
    var newCursor = new (cursor.constructor)(cursor._mongo, cursorDescription);
    FindFaster._keepHandles[observeKey] = newCursor.observeChanges({added: function() {}}); 

    timeoutKeepObserver(cursor, observeKey);
  }
  
  FindFaster._lastTimeObserverUsed[observeKey] = Date.now();
  // since FindFaster is eventual consistancy
  // asking expectedDocs values makes us to make FindFaster closer
  // to strong consistancy for simple fetchs like _id
  var expectedDocs = FindFaster._getExpectedDocs(cursor);

  //transform function
  var transform = cursor.getTransform();
  if(transform) {
    transform = LocalCollection.wrapTransform(transform);
  }
  
  var multiplexer = FindFaster._keepHandles[observeKey]._multiplexer;
  var docs = getDocsFromMultiflexer(multiplexer, dontClone, transform);
  if(docs.length >= expectedDocs) {
    return docs;
  } else {
    cursor._mongo._oplogHandle.waitUntilCaughtUp();
    return getDocsFromMultiflexer(multiplexer, dontClone, transform);
  }
}

function getDocsFromMultiflexer(multiplexer, dontClone, transform) {
  var docs = [];
  multiplexer._queue.runTask(function() {
    if(dontClone) {
      docs = multiplexer._cache.docs;
    } else {
      multiplexer._cache.docs.forEach(function(doc) {
        doc = EJSON.clone(doc);
        doc = (transform)? transform(doc): doc;
        docs.push(doc);
      });
    }
  });
  return docs;
}

function getExpectedDocs(cursor) {
  if(cursor._cursorDescription.options.expectedDocs) {
    return cursor._cursorDescription.options.expectedDocs;
  } else if(FindFaster.expectedDocs.get()) {
    return FindFaster.expectedDocs.get();
  } else {
    return FindFaster.defaultExpectedDocs;
  }
}

function timeoutKeepObserver(cursor, observeKey) {
  var lastTimeObserved = FindFaster._lastTimeObserverUsed[observeKey] || Date.now();
  var timeoutValue = (lastTimeObserved + FindFaster.timeout) - Date.now();

  if(timeoutValue > 0) {
    setTimeout(function() {
      timeoutKeepObserver(cursor, observeKey);
    }, timeoutValue);
  } else {
    FindFaster._keepHandles[observeKey].stop();
    FindFaster._keepHandles[observeKey] = null;
    FindFaster._lastTimeObserverUsed[observeKey] = null;
  }
}