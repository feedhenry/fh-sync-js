var api_sync = require("./sync-client");

// Mounting into global fh namespace
var fh = window.$fh = window.$fh || {};
fh.sync = api_sync;

module.exports = fh.sync;