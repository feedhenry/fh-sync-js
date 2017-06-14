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


## Some Available Typescript sync API methods

A dataset is the data that is created and used by the sync API.

```typescript
 
// Initialise the client data sync service. 
sync.init(options: SyncOptions);

// Register a callback function to be invoked when the sync service has notifications to communicate to the client.   
sync.notify(datasetId: string, callback:NotifyCallback);
 
// Put a dataset under the management of the sync service. Calling manage multiple times for the same dataset will update the options and query_params but will not result in the dataset syncing multiple times 
sync.manage(datasetId: string, options:SyncOptions, query_params:{}, meta_data:{}, callback:() => void);
  
// Get a list of the records for the dataset.   
sync.doList(datasetId: string, success:(dataset:any) => void, failure:(err:string, datasetId:string) => void);
 
// Update the data associated with the unique id.
sync.doCreate(datasetId: string, data:any, success:(obj:any) => void, failure?:(err:string, datasetId:string)=> void);

// Read a single data record. 
sync.doRead(datasetId:string, uid:string, success:(record:any)=> void, failure:(err:string, datasetId:string)=> void);

// Update the data associated with the unique id.  
sync.doUpdate(datasetId:string, uid:string, data:any, success:(obj:any)=> void, failure?:(err:string, datasetId:string)=> void);

// Delete the data associated with the unique id. 
sync.doDelete(datasetId:string, uid:string, success?:(obj:any)=> void, failure?:(err:string, datasetId:string)=> void);

//Start the sync loop if 'sync_active' option is set to false.    
sync.startSync(datasetId:string, success:()=> void, failure?:(obj:any)=> void);
  
// Stop the sync loop for a dataset. 
sync.stopSync(datasetId:string, success?:()=> void, failure?:(obj:any)=> void);

// Run the sync loop almost immediately (within next 500 ms) if sync_active is true. 
sync.doSync(datasetId, success?:()=> void, failure?:(err:string, datasetId:string)=> void);
  
// Run the sync loop almost immediately (within next 500 ms) even if sync_active is false.  
sync.forceSync(datasetId:string,success?: ()=> void, failure?: (err: string, datasetId: string)=> void);
 
 ```
see _./fh-sync-js.d.ts_ for more methods