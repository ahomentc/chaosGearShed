export let getFromCache = (key) => {
  var object = JSON.parse(localStorage.getItem(key));
  return object.value;
}

export let cache = (key, value) => {
  var timestamp = Math.floor(Date.now() / 1000);
  var object = {value: value, timestamp: timestamp}
  localStorage.setItem(key, JSON.stringify(object));
}

export let shouldUseCache = (key, seconds) => {
  var object = JSON.parse(localStorage.getItem(key));
  if (object == null || object == undefined) {
    return false
  }
  var timestamp = object.timestamp;
  var now = Math.floor(Date.now() / 1000);
  return (now - timestamp) < seconds;
}

export default {getFromCache, cache, shouldUseCache}