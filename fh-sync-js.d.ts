// Type definitions for fh-sync-js 2.18.0
// Project: https://github.com/feedhenry/fh-sync-js
// Definitions by: feedhenry-raincatcher@redhat.com


/**
 * Interface for the data provided in the NotifyCallback in the notify function.
 * @interface NotificationData
 */
export interface NotificationData {
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
export interface SyncOptions {
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
  icloud_backup?: boolean,

  /* 
   * If set, the client will resend the pending changes that are inflight, but haven't crashed, and have lived longer than this value.
   * This is to prevent the situation where updates are lost for certain pending changes, those pending changes will be stuck on the client forever.
   * Default value is 24 hours.
   * Optional. Default: 60*24
   */
  resend_inflight_pendings_minutes?: number
}

/**
 * Interface for the callback used in the notify function.
 *
 * @interface NotifyCallback
 */
export interface NotifyCallback {
  (data: NotificationData): any
}

/**
 * Interface for everything a sync client can do
 */
export interface SyncApi {

  /**
   * Initialize the client data sync service.
   *
   * @param {Object} options 
   */
  init(options: SyncOptions): void;

  /**
   * Register a callback function to be invoked when the sync service has notifications to communicate to the client.
   * 
   * @param dataset_id - dataset identifier
   * @param {Function} callback
   */
  notify(dataset_id: string, callback: NotifyCallback): void;

  /**
   * Put a dataset under the management of the sync service.
   *
   * @param {String} datasetId
   * @param {Object} options
   * @param {Object} query_params
   * @param {Object} meta_data
   * @param {Function} callback
   */
  manage(datasetId: string, options: SyncOptions, query_params: any, meta_data: any, callback: () => void): void;

  /**
   * Get a list of the records for the dataset.
   *
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  doList(datasetId: string, success: (dataset: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * Update the data associated with the unique id.
   *
   * @param {String} datasetId
   * @param {Object} data
   * @param {Function} success
   * @param {Function} [failure]
   */
  doCreate(datasetId: string, data: any, success: (obj: any) => void, failure?: (err: string, datasetId: string) => void): void;

  /**
   * Read a single data record.
   *
   * @param {String} datasetId
   * @param {String} uid
   * @param {Function} success
   * @param {Function} failure
   */
  doRead(datasetId: string, uid: string, success: (record: any) => void, failure?: (err: string, datasetId: string) => void): void;

  /**
   * Update the data associated with the unique id.
   *
   * @param {String} datasetId
   * @param {String} uid
   * @param {Object} data
   * @param {Function} success
   * @param {Function} failure
   */
  doUpdate(datasetId: string, uid: string, data: any, success: (obj: any) => void, failure?: (err: string, datasetId: string) => void): void;

  /**
   * Delete the data associated with the unique id.
   *
   * @param {String} datasetId
   * @param {String} uid
   * @param {Function} success
   * @param {Function} failure
   */
  doDelete(datasetId: string, uid: string, success: (obj: any) => void, failure?: (err: string, datasetId: string) => void): void;

  /**
   * Start the sync loop if `sync_active` option is set to false.
   *
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  startSync(datasetId: string, success: () => void, failure?: (obj: any) => void): void;

  /**
   * Stop the sync loop for a dataset.
   *
   * @param {String} datasetId
   * @param {Function} [success]
   * @param {Function} [failure]
   */
  stopSync(datasetId: string, success?: () => void, failure?: (obj: any) => void): void;

  /**
   * Run the sync loop almost immediately (within next 500 ms) if `sync_active` is true.
   *
   * @param {String} datasetId
   * @param {Function} [success]
   * @param {Function} [failure]
   */
  doSync(datasetId: string, success?: () => void, failure?: (err: string, datasetId: string) => void): void;

  /**
   * Run the sync loop almost immediately (within next 500 ms) even if `sync_active` is false.
   *
   * @param {String} datasetId
   * @param {Function} [success]
   * @param {Function} [failure]
   */
  forceSync(datasetId: string, success?: () => void, failure?: (err: string, datasetId: string) => void): void;

  /**
   * List collisions in sync
   *
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  listCollisions(datasetId: string, success: (res: any) => void, failure?: (msg: string, err: any) => void): void;

  /**
   * Remove a collision in sync
   *
   * @param {String} datasetId
   * @param {String} collisionHash
   * @param {Function} success
   * @param {Function} failure
   */
  removeCollision(datasetId: string, collisionHash: string, success: (res: any) => void, failure: (msg: string, err: any) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} callback
   */
  getPending(datasetId: string, callback: () => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} callback
   */
  clearPending(datasetId: string, callback: () => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  getDataSet(datasetId: string, success: (dataset: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  getQueryParams(datasetId: string, success: (queryParams: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  setQueryParams(datasetId: string, success: (queryParams: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  getMetaData(datasetId: string, success: (queryParams: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  setMetaData(datasetId: string, metaData: any, success: (metaData: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  getConfig(datasetId: string, success: (config: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  setConfig(datasetId: string, config: any, success: (config: any) => void, failure: (err: string, datasetId: string) => void): void;

  /**
   * Produces a SHA1 hash of the provided object (sorted before hash) or string.
   *
   * @param {Object|String} toHash - Object to hash
   * @returns {String} - SHA1 hash of the provided string or object.
   */
  generateHash(toHash: {} | string): string;

  /**
   * @param {String} datasetId
   * @param {Function} success
   * @param {Function} failure
   */
  loadDataSet(datasetId: string, success: (dataset: any) => void, failure: () => void): void;

  /**
   * @param {String} datasetId
   * @param {Function} callback
   */
  clearCache(datasetId: string, callback?: () => void): void;

  /**
   * Sets cloud call handler for sync. Required to make any sync requests to the server side (sync cloud)
   * 
   * @param {Function} handler - method responsible for handling network requests
   */
  setCloudHandler(handler: (params: any, success: (result: any) => void, failure: (error: any) => void) => void): void;

  /**
   * Allows to override default storage adapter
   *
   * @param handler - function that wraps underlying storage solution
   */
  setStorageAdapter(handler: (dataset_id: string, isSave: boolean, cb: any) => void): void;
  /**
   * Allows to override default hashing method
   *
   * @param method - function that wraps underlying hashing method
   */
  setHashMethod(method: () => any): void;
}

/**
 * Used to create an isolated instance of the SyncApi
 */
interface SyncApiFactory {
  factory(id: string): SyncApi;
}

declare const sync: SyncApi & SyncApiFactory;
export = sync;
