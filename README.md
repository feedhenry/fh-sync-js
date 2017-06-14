FeedHenry Sync Javascript client
========================

Data synchonization javascript client.
Library can be used for offline storage of mobile applications data.

## Required setup

To use the sync client you need a sync server setup first see https://github.com/feedhenry/fh-sync .
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
