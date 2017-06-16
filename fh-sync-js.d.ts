// Type definitions for fh-sync-js 2.18.0
// Project: https://github.com/feedhenry/fh-sync-js
// Definitions by: feedhenry-raincatcher@redhat.com

/** @module SyncClient */
declare module SyncClient {

  /**
   * Interface for the data provided in the NotifyCallback in the notify function.
   * @interface NotificationData
   */
  interface NotificationData {
    dataset_id: string;
    uid: string;
    message?: string;
    code: string;
  }

  /**
   * Interface for the options object provided to the init function.
   *
   * @interface SyncOptions
   */
  interface SyncOptions {
    /**
     * Sync cloud url (used by default handler to call server)
     */
    cloudUrl: string,

    /**
    * How often to synchronize data with the cloud, in seconds.
    * Optional. Default: 10
    */
    sync_frequency?: number,

    /**
    * Should local changes be synchronized to the cloud immediately, or should they wait for the next synchronization interval.
    * Optional. Default: true
    */
    auto_sync_local_updates?: boolean,

    /**
    * Should a notification event be triggered when loading or saving to client storage fails.
    * Optional. Default: true
    */
    notify_client_storage_failed?: boolean,

    /**
     * Should a notification event be triggered when a synchronization cycle with the server has been started.
     * Optional. Default: true
     */
    notify_sync_started?: boolean,

    /**
     * Should a notification event be triggered when a synchronization cycle with the server has been completed.
     * Optional. Default: true
     */
    notify_sync_complete?: boolean,

    /**
     * Should a notification event be triggered when an attempt was made to update a record while offline.
     * Optional. Default: true
     */
    notify_offline_update?: boolean,

    /**
     * Should a notification event be triggered when an update failed due to data collision.
     * Optional. Default: true
     */
    notify_collision_detected?: boolean,

    /**
     * Should a notification event be triggered when an update was applied to the local data store.
     * Optional. Default: true
     */
    notify_local_update_applied?: boolean,

    /**
     * Should a notification event be triggered when an update failed for a reason other than data collision.
     * Optional. Default: true
     */
    notify_remote_update_failed?: boolean,

    /**
     * Should a notification event be triggered when an update was applied to the remote data store.
     * Optional. Default: true
     */
    notify_remote_update_applied?: boolean,

    /**
     * Should a notification event be triggered when a delta was received from the remote data store.
     * Optional. Default: true
     */
    notify_delta_received?: boolean,

    /**
     * Should a notification event be triggered when a delta was received from the remote data store for a record.
     * Optional. Default: true
     */
    notify_record_delta_received?: boolean,

    /**
     * Should a notification event be triggered when the synchronization loop failed to complete.
     * Optional. Default: true
     */
    notify_sync_failed?: boolean,

    /**
     * How many synchronization cycles to check for updates on crashed in-flight updates.
     * Optional. Default: 10
     */
    crashed_count_wait?: number,

    /**
     * If crashed_count_wait limit is reached, should the client retry sending the crashed in flight pending records.
     * Optional. Default: true
     */
    resend_crashed_updates?: boolean,

    /**
     * Is the background synchronization with the cloud currently active. If this is set to false, the synchronization loop will not start automatically.
     * You need to call startSync to start the synchronization loop. Optional. Default: true
     */
    sync_active?: boolean,

    /**
     * Storage strategy to use for the underlying client storage framework Lawnchair. Valid values include 'dom', 'html5-filesystem', 'webkit-sqlite', 'indexed-db'.
     * Multiple values can be specified as an array and the first valid storage option will be used.
     * Optional. Default: 'html5-filesystem'
     */
    storage_strategy?: "html5-filesystem" | "dom" | "webkit-sqlite" | "indexed-db"

    /**
     * Amount of space to request from the HTML5 filesystem API when running in browser
     * Optional. Default: 50 * 1024 * 1024
     */
    file_system_quota?: number,

    /**
     * iOS only. If set to true, the file will be backed by iCloud. Default to false;
     */
    icloud_backup?: boolean
  }

  /**
   * Interface for the callback used in the notify function.
   *
   * @interface NotifyCallback
   */
  interface NotifyCallback {
    (data: NotificationData): any
  }

  /**
   * Initialize the client data sync service.
   *
   * @param {Object} options
   * @param {String} [options.cloudUrl=""] - Sync cloud url (used by default handler to call server)
   * @param {Number} [options.sync_frequency=10] - How often to synchronize data with the cloud, in seconds.
   * @param {Boolean} [options.auto_sync_local_updates=true] - Should local changes be synchronized to the cloud immediately, or should they wait for the next synchronization interval.
   * @param {Boolean} [options.notify_client_storage_failed=true] - Should a notification event be triggered when loading or saving to client storage fails.
   * @param {Boolean} [options.notify_sync_started=true] - Should a notification event be triggered when a synchronization cycle with the server has been started.
   * @param {Boolean} [options.notify_sync_complete=true] - Should a notification event be triggered when a synchronization cycle with the server has been completed.
   * @param {Boolean} [options.notify_offline_update=true] - Should a notification event be triggered when an attempt was made to update a record while offline.
   * @param {Boolean} [options.notify_collision_detected=true] - Should a notification event be triggered when an update failed due to data collision.
   * @param {Boolean} [options.notify_local_update_applied=true] - Should a notification event be triggered when an update was applied to the local data store.
   * @param {Boolean} [options.notify_remote_update_failed=true] - Should a notification event be triggered when an update failed for a reason other than data collision.
   * @param {Boolean} [options.notify_remote_update_applied=true] - Should a notification event be triggered when an update was applied to the remote data store.
   * @param {Boolean} [options.notify_delta_received=true] - Should a notification event be triggered when a delta was received from the remote data store.
   * @param {Boolean} [options.notify_record_delta_received=true] - Should a notification event be triggered when a delta was received from the remote data store for a record.
   * @param {Boolean} [options.notify_sync_failed=true] - Should a notification event be triggered when the synchronization loop failed to complete.
   * @param {Boolean} [options.do_console_log=false] - Should log statements be written to console.log. Will be useful for debugging.
   * @param {Number} [options.crashed_count_wait=10] - How many synchronization cycles to check for updates on crashed in-flight updates.
   * @param {Boolean} [options.resend_crashed_updates=true] - If crashed_count_wait limit is reached, should the client retry sending the crashed in flight pending records.
   * @param {Boolean} [options.sync_active=true] - Is the background synchronization with the cloud currently active. If this is set to false, the synchronization loop will not start automatically. You need to call startSync to start the synchronization loop.
   * @param {String} [options.storage_strategy=html5_filesystem] - Storage strategy to use for the underlying client storage framework Lawnchair. Valid values include 'dom', 'html5-filesystem', 'webkit-sqlite', 'indexed-db'. Multiple values can be specified as an array and the first valid storage option will be used. If the app is running on Titanium, the only support value is 'titanium'.
   * @param {Number} [options.file_system_quota=52428800] - Amount of space to request from the HTML5 filesystem API when running in browser
   * @param {Boolean} [options.icloud_backup=false] - iOS only. If set to true, the file will be backed by iCloud. 
   */
  function init(options: SyncOptions): void;

  /**
   * Register a callback function to be invoked when the sync service has notifications to communicate to the client.
   * 
   * @param dataset_id - dataset identifier
   * @param {Function} callback
   */
  function notify(dataset_id: string, callback: NotifyCallback): void;
  /**
   * Put a dataset under the management of the sync service.
   *
   * @param {String} datasetId
   * @param {Object} options
   * @param {String} [options.cloudUrl=""] - Sync cloud url (used by default handler to call server)
   * @param {Number} [options.sync_frequency=10] - How often to synchronize data with the cloud, in seconds.
   * @param {Boolean} [options.auto_sync_local_updates=true] - Should local changes be synchronized to the cloud immediately, or should they wait for the next synchronization interval.
   * @param {Boolean} [options.notify_client_storage_failed=true] - Should a notification event be triggered when loading or saving to client storage fails.
   * @param {Boolean} [options.notify_sync_started=true] - Should a notification event be triggered when a synchronization cycle with the server has been started.
   * @param {Boolean} [options.notify_sync_complete=true] - Should a notification event be triggered when a synchronization cycle with the server has been completed.
   * @param {Boolean} [options.notify_offline_update=true] - Should a notification event be triggered when an attempt was made to update a record while offline.
   * @param {Boolean} [options.notify_collision_detected=true] - Should a notification event be triggered when an update failed due to data collision.
   * @param {Boolean} [options.notify_local_update_applied=true] - Should a notification event be triggered when an update was applied to the local data store.
   * @param {Boolean} [options.notify_remote_update_failed=true] - Should a notification event be triggered when an update failed for a reason other than data collision.
   * @param {Boolean} [options.notify_remote_update_applied=true] - Should a notification event be triggered when an update was applied to the remote data store.
   * @param {Boolean} [options.notify_delta_received=true] - Should a notification event be triggered when a delta was received from the remote data store.
   * @param {Boolean} [options.notify_record_delta_received=true] - Should a notification event be triggered when a delta was received from the remote data store for a record.
   * @param {Boolean} [options.notify_sync_failed=true] - Should a notification event be triggered when the synchronization loop failed to complete.
   * @param {Boolean} [options.do_console_log=false] - Should log statements be written to console.log. Will be useful for debugging.
   * @param {Number} [options.crashed_count_wait=10] - How many synchronization cycles to check for updates on crashed in-flight updates.
   * @param {Boolean} [options.resend_crashed_updates=true] - If crashed_count_wait limit is reached, should the client retry sending the crashed in flight pending records.
   * @param {Boolean} [options.sync_active=true] - Is the background synchronization with the cloud currently active. If this is set to false, the synchronization loop will not start automatically. You need to call startSync to start the synchronization loop.
   * @param {String} [options.storage_strategy=html5_filesystem] - Storage strategy to use for the underlying client storage framework Lawnchair. Valid values include 'dom', 'html5-filesystem', 'webkit-sqlite', 'indexed-db'. Multiple values can be specified as an array and the first valid storage option will be used. If the app is running on Titanium, the only support value is 'titanium'.
   * @param {Number} [options.file_system_quota=52428800] - Amount of space to request from the HTML5 filesystem API when running in browser
   * @param {Boolean} [options.icloud_backup=false] - iOS only. If set to true, the file will be backed by iCloud.
   * @param {Object} query_params
   * @param {Object} meta_data
   * @param {Function} callback
   */
  function manage(datasetId: string, options: SyncOptions, query_params: {}, meta_data: {}, callback: () => void): void;

  /**
   * Get a list of the records for the dataset.
   *
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  function doList(datasetId: string, success: (dataset: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * Update the data associated with the unique id.
   *
   * @param {String} datasetId
   * @param {Object} data
   * @param {Function} success
   * @param {Function} [failure]
   */
  function doCreate(datasetId: string, data: any, success: (obj: any) => void, failure?: (err: string, datasetId: string) => void): void;

  /**
   * Read a single data record.
   *
   * @param {String} datasetId
   * @param {String} uid
   * @param {Function} success
   * @param {Function} failure
   */
  function doRead(datasetId: string, uid: string, success: (record: any) => void, failure?: (err: string, datasetId: string) => void): void;

  /**
   * Update the data associated with the unique id.
   *
   * @param {String} datasetId
   * @param {String} uid
   * @param {Object} data
   * @param {Function} success
   * @param {Function} failure
   */
  function doUpdate(datasetId: string, uid: string, data: any, success: (obj: any) => void, failure?: (err: string, datasetId: string) => void): void;

  /**
   * Delete the data associated with the unique id.
   *
   * @param {String} datasetId
   * @param {String} uid
   * @param {Function} success
   * @param {Function} failure
   */
  function doDelete(datasetId: string, uid: string, success: (obj: any) => void, failure?: (err: string, datasetId: string) => void): void;

  /**
   * Start the sync loop if `sync_active` option is set to false.
   *
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  function startSync(datasetId: string, success: () => void, failure?: (obj: any) => void): void;

  /**
   * Stop the sync loop for a dataset.
   *
   * @param {String} datasetId
   * @param {Function} [success]
   * @param {Function} [failure]
   */
  function stopSync(datasetId: string, success?: () => void, failure?: (obj: any) => void): void;

  /**
   * Run the sync loop almost immediately (within next 500 ms) if `sync_active` is true.
   *
   * @param {String} datasetId
   * @param {Function} [success]
   * @param {Function} [failure]
   */
  function doSync(datasetId: string, success?: () => void, failure?: (err: string, datasetId: string) => void): void;

  /**
   * Run the sync loop almost immediately (within next 500 ms) even if `sync_active` is false.
   *
   * @param {String} datasetId
   * @param {Function} [success]
   * @param {Function} [failure]
   */
  function forceSync(datasetId: string, success?: () => void, failure?: (err: string, datasetId: string) => void): void;

  /**
   * List collisions in sync
   *
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  function listCollisions(datasetId: string, success: (res: any) => void, failure?: (msg: string, err: any) => void): void;

  /**
   * Remove a collision in sync
   *
   * @param {String} datasetId
   * @param {String} collisionHash
   * @param {Function} success
   * @param {Function} failure
   */
  function removeCollision(datasetId: string, collisionHash: string, success: (res: any) => void, failure: (msg: string, err: any) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} callback
   */
  function getPending(datasetId: string, callback: () => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} callback
   */
  function clearPending(datasetId: string, callback: () => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  function getDataSet(datasetId: string, success: (dataset: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  function getQueryParams(datasetId: string, success: (queryParams: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  function setQueryParams(datasetId: string, success: (queryParams: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  function getMetaData(datasetId: string, success: (queryParams: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  function setMetaData(datasetId: string, metaData: any, success: (metaData: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  function getConfig(datasetId: string, success: (config: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  function setConfig(datasetId: string, config: any, success: (config: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * Produces a SHA1 hash of the provided object (sorted before hash) or string.
   *
   * @param {Object|String} toHash - Object to hash
   * @returns {String} - SHA1 hash of the provided string or object.
   */
  function generateHash(toHash: {} | string): string;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  function loadDataSet(datasetId: string, success: (dataset: any) => void, failure: () => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} callback
   */
  function clearCache(datasetId: string, callback?: () => void): void;

  /**
   * Sets cloud call handler for sync. Required to make any sync requests to the server side (sync cloud)
   * 
   * @param {Function} handler - method responsible for handling network requests
   */
  function setCloudHandler(handler: (params: any, success: (result: any) => void, failure: (error: any) => void) => void): void;

  /**
   * Allows to override default storage adapter
   *
   * @param handler - function that wraps underlying storage solution
   */
  function setStorageAdapter(handler: (dataset_id: string, isSave: boolean, cb: any) => void): void;
  /**
   * Allows to override default hashing method
   *
   * @param method - function that wraps underlying hashing method
   */
  function setHashMethod(method: () => any): void;
}

export = SyncClient;
