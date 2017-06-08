FeedHenry Sync Javascript client
========================
 
[Note] This repository it's currently in development for production version
please refer to fh-js-sdk npm module.

## Required setup

Sync client using default Ajax handler to call sync server. 
Server URL can be configured using following variables

- cloudUrl - URL to sync server
- cloudPath (optional) - allows to use custom endpoint for sync (defaults to `/sync/`)

For example: 
```javascript
syncClient.init({
    cloudUrl:"http://localhost:3000",
    do_console_log: true,
    sync_frequency: 1,
    sync_active: false,
    storage_strategy: ['memory'],
    crashed_count_wait: 0
});
```

## Building

    npm install
    grunt 

## Relation for fh-js-sdk

Feedhenry JS SDK contains various libraries and also includes fh-sync-js library.

