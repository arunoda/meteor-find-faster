var cursorProto = FastRead._getCursorProto();
var originalFetch = cursorProto.fetch;

cursorProto.fetch = function() {
  if(FastRead._canUseFastRead(this)) {
    return FastRead._fetch(this);
  } else {
    return originalFetch.apply(this, arguments);
  }
};

