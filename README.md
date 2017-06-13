FeedHenry Sync Javascript client
========================
 
[Note] This repository it's currently in development for production version
please refer to fh-js-sdk npm module.

## Required setup

To use the sync client you need a sync server setup first see https://github.com/feedhenry/fh-sync .
Sync client using default Ajax handler to call sync server.   
Server URL can be configured using following variables 

- cloudUrl - URL to sync server
- cloudPath (optional) - allows to use custom endpoint for sync (defaults to `/sync/`)

Setting up your own server see
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

## Example App

The ../dist/fh-sync.js is create with grunt and is the runtime application that is called duing client sync. To run the client open _./example/index.html_ in a browser when the server
 is running. You won't see anything running in the browser until you check the developer tools (ctrl/shift/i)
Check the network tabs and console tabs to see sync in action. 
For more information on browser developer tools see

https://developer.chrome.com/devtools

https://developer.mozilla.org/en-US/docs/Tools/Tools_Toolbox


## Some Available sync API methods

```typescript
 
// Initialise the client data sync service. 
sync.init(options: SyncOptions);

// Register a callback function to be invoked when the sync service has notifications to communicate to the client.   
sync.notify(dataset_id:string, callback(data));
 
// Put a dataset under the management of the sync service. Calling manage multiple times for the same dataset will update the options and query_params but will not result in the dataset syncing multiple times 
sync.manage(dataset_id:string, options:SyncOptions, query_params:{}, meta_data:{}, callback:());
  
// Get a list of the records for the dataset.   
sync.doList(dataset_id:string, success:(dataset:any), failure:(err:string, datasetId:string));
 
// Update the data associated with the unique id.
sync.doCreate(dataset_id:string, data:any, success:(dataset:any), failure:(err:string, datasetId:string));

// Read a single data record. 
sync.doRead(dataset_id:string, uid:string, success:(dataset:any), failure:(err:string, datasetId:string));

// Update the data associated with the unique id.  
sync.doUpdate(dataset_id, uid, data, success:(dataset:any), failure:(err:string, datasetId:string));

// Delete the data associated with the unique id. 
sync.doDelete(dataset_id:string, uid:string, success:(dataset:any), failure:(err:string, datasetId:string));

//Start the sync loop if 'sync_active' option is set to false.    
sync.startSync(dataset_id:string, success:(), failure:(obj:any));
  
// Stop the sync loop for a dataset. 
sync.stopSync(dataset_id, success:(), failure:(obj:any));


// Run the sync loop almost immediately (within next 500 ms) if sync_active is true. 
sync.doSync(dataset_id, success:(), failure?:(err:string, datasetId:string));
  
// Run the sync loop almost immediately (within next 500 ms) even if sync_active is false.  
sync.forceSync(dataset_id:string,success?: (), failure?: (err: string, datasetId: string));
 
 ```
see _./fh-sync-js.d.ts_ for more methods