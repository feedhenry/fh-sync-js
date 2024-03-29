var CryptoJS = require("../libs/generated/crypto");
var Lawnchair = require('../libs/lawnchair/lawnchair');
var defaultCloudHandler = require('./cloudHandler');
var cidProvider = require('./clientIdProvider');

var MILLISECONDS_IN_MINUTE = 60*1000;

module.exports = newClient;

function newClient(id) {

  var clientId = (id || '') + cidProvider.getClientId();
  
  var self = {

    // CONFIG
    defaults: {
      "sync_frequency": 10,
      // How often to synchronise data with the cloud in seconds.
      "auto_sync_local_updates": true,
      // Should local chages be syned to the cloud immediately, or should they wait for the next sync interval
      "notify_client_storage_failed": true,
      // Should a notification event be triggered when loading/saving to client storage fails
      "notify_connection_to_storage_failed": true,
      // Should a notification event be triggered when connection to client storage fails
      "notify_sync_started": true,
      // Should a notification event be triggered when a sync cycle with the server has been started
      "notify_sync_complete": true,
      // Should a notification event be triggered when a sync cycle with the server has been completed
      "notify_offline_update": true,
      // Should a notification event be triggered when an attempt was made to update a record while offline
      "notify_collision_detected": true,
      // Should a notification event be triggered when an update failed due to data collision
      "notify_remote_update_failed": true,
      // Should a notification event be triggered when an update failed for a reason other than data collision
      "notify_local_update_applied": true,
      // Should a notification event be triggered when an update was applied to the local data store
      "notify_remote_update_applied": true,
      // Should a notification event be triggered when an update was applied to the remote data store
      "notify_delta_received": true,
      // Should a notification event be triggered when a delta was received from the remote data store for the dataset 
      "notify_record_delta_received": true,
      // Should a notification event be triggered when a delta was received from the remote data store for a record
      "notify_sync_failed": true,
      // Should a notification event be triggered when the sync loop failed to complete
      "do_console_log": false,
      // Should log statements be written to console.log
      "crashed_count_wait" : 10,
      // How many syncs should we check for updates on crashed in flight updates before we give up searching
      "resend_crashed_updates" : true,
      // If we have reached the crashed_count_wait limit, should we re-try sending the crashed in flight pending record
      "sync_active" : true,
      // Is the background sync with the cloud currently active
      "storage_strategy" : "html5-filesystem",
      // Storage strategy to use for Lawnchair - supported strategies are 'html5-filesystem' and 'dom'
      "file_system_quota" : 50 * 1024 * 1204,
      // Amount of space to request from the HTML5 filesystem API when running in browser
      "icloud_backup" : false, //ios only. If set to true, the file will be backed by icloud
      // If set, the client will resend those inflight pending changes that have lived longer than this value.
      // This is to prevent the situation where updates are lost for certain pending changes, those pending changes will be stuck on the client forever.
      // Default value is 24 hours.
      "resend_inflight_pendings_minutes": 60*24
    },

    notifications: {
      "CLIENT_STORAGE_FAILED": "client_storage_failed",
      // loading/saving to client storage failed,
      "CONNECTION_TO_STORAGE_FAILED": "connection_to_storage_failed",
      // when connection is lost to storage strategy
      "SYNC_STARTED": "sync_started",
      // A sync cycle with the server has been started
      "SYNC_COMPLETE": "sync_complete",
      // A sync cycle with the server has been completed
      "OFFLINE_UPDATE": "offline_update",
      // An attempt was made to update a record while offline
      "COLLISION_DETECTED": "collision_detected",
      //Update Failed due to data collision
      "REMOTE_UPDATE_FAILED": "remote_update_failed",
      // Update Failed for a reason other than data collision
      "REMOTE_UPDATE_APPLIED": "remote_update_applied",
      // An update was applied to the remote data store
      "LOCAL_UPDATE_APPLIED": "local_update_applied",
      // An update was applied to the local data store
      "DELTA_RECEIVED": "delta_received",
      // A delta was received from the remote data store for the dataset 
      "RECORD_DELTA_RECEIVED": "record_delta_received",
      // A delta was received from the remote data store for the record 
      "SYNC_FAILED": "sync_failed"
      // Sync loop failed to complete
    },

    datasets: {},

    // Initialise config to default values;
    config: undefined,

    //TODO: deprecate this
    notify_callback: undefined,

    notify_callback_map : {},

    init_is_called: false,

    //this is used to map the temp data uid (created on client) to the real uid (created in the cloud)
    uid_map: {},

    // PUBLIC FUNCTION IMPLEMENTATIONS
    init: function(options) {
      self.consoleLog('sync - init called');

      self.config = JSON.parse(JSON.stringify(self.defaults));
      for (var i in options) {
        self.config[i] = options[i];
      }

      //prevent multiple monitors from created if init is called multiple times
      if(!self.init_is_called){
        self.init_is_called = true;
        self.datasetMonitor();
      }
      defaultCloudHandler.init(self.config.cloudUrl, self.config.cloudPath);
    },

    notify: function(datasetId, callback) {
      if(arguments.length === 1 && typeof datasetId === 'function'){
        self.notify_callback = datasetId;
      } else {
        self.notify_callback_map[datasetId] = callback;
      }
    },

    manage: function(dataset_id, opts, query_params, meta_data, cb) {
      self.consoleLog('manage - START');

      // Currently we do not enforce the rule that init() function should be called before manage().
      // We need this check to guard against self.config undefined
      if (!self.config){
        self.config = JSON.parse(JSON.stringify(self.defaults));
      }

      var options = opts || {};

      var doManage = function(dataset) {
        self.consoleLog('doManage dataset :: initialised = ' + dataset.initialised + " :: " + dataset_id + ' :: ' + JSON.stringify(options));

        var currentDatasetCfg = (dataset.config) ? dataset.config : self.config;
        var datasetConfig = self.setOptions(currentDatasetCfg, options);

        dataset.query_params = query_params || dataset.query_params || {};
        dataset.meta_data = meta_data || dataset.meta_data || {};
        dataset.config = datasetConfig;
        dataset.syncRunning = false;
        dataset.syncPending = true;
        dataset.initialised = true;
        if(typeof dataset.meta === "undefined"){
          dataset.meta = {};
        }

        self.saveDataSet(dataset_id, function() {

          if( cb ) {
            cb();
          }
        });
      };

      // Check if the dataset is already loaded
      self.getDataSet(dataset_id, function(dataset) {
        self.consoleLog('manage - dataset already loaded');
        doManage(dataset);
      }, function(err) {
        self.consoleLog('manage - dataset not loaded... trying to load');

        // Not already loaded, try to load from local storage
        self.loadDataSet(dataset_id, function(dataset) {
            self.consoleLog('manage - dataset loaded from local storage');

            // Loading from local storage worked

            // Fire the local update event to indicate that dataset was loaded from local storage
            self.doNotify(dataset_id, null, self.notifications.LOCAL_UPDATE_APPLIED, "load");

            // Put the dataet under the management of the sync service
            doManage(dataset);
          },
          function(err) {
            // No dataset in memory or local storage - create a new one and put it in memory
            self.consoleLog('manage - Creating new dataset for id ' + dataset_id);
            var dataset = {};
            dataset.data = {};
            dataset.pending = {};
            dataset.meta = {};
            self.datasets[dataset_id] = dataset;
            doManage(dataset);
          });
      });
    },

    /**
     * Sets options for passed in config, if !config then options will be applied to default config.
     * @param {Object} config - config to which options will be applied
     * @param {Object} options - options to be applied to the config
     */
    setOptions: function(config, options) {
      // Make sure config is initialised
      if( ! config ) {
        config = JSON.parse(JSON.stringify(self.defaults));
      }


      var datasetConfig = JSON.parse(JSON.stringify(config));
      var optionsIn = JSON.parse(JSON.stringify(options));
      for (var k in optionsIn) {
        datasetConfig[k] = optionsIn[k];
      }

      return datasetConfig;
    },

    list: function(dataset_id, success, failure) {
      self.getDataSet(dataset_id, function(dataset) {
        if (dataset && dataset.data) {
          // Return a copy of the dataset so updates will not automatically make it back into the dataset
          var res = JSON.parse(JSON.stringify(dataset.data));
          success(res);
        } else {
          if(failure) {
            failure('no_data');
          }
        }
      }, function(code, msg) {
        if(failure) {
          failure(code, msg);
        }
      });
    },

    getUID: function(oldOrNewUid){
      var uid = self.uid_map[oldOrNewUid];
      if(uid || uid === 0){
        return uid;
      } else {
        return oldOrNewUid;
      }
    },

    create: function(dataset_id, data, success, failure) {
      if(data == null){
        if(failure){
          return failure("null_data");
        }
      }
      self.addPendingObj(dataset_id, null, data, "create", success, failure);
    },

    read: function(dataset_id, uid, success, failure) {
      self.getDataSet(dataset_id, function(dataset) {
        uid = self.getUID(uid);
        var rec = dataset.data[uid];
        if (!rec) {
          failure("unknown_uid");
        } else {
          // Return a copy of the record so updates will not automatically make it back into the dataset
          var res = JSON.parse(JSON.stringify(rec));
          success(res);
        }
      }, function(code, msg) {
        if(failure) {
          failure(code, msg);
        }
      });
    },

    update: function(dataset_id, uid, data, success, failure) {
      uid = self.getUID(uid);
      self.addPendingObj(dataset_id, uid, data, "update", success, failure);
    },

    'delete': function(dataset_id, uid, success, failure) {
      uid = self.getUID(uid);
      self.addPendingObj(dataset_id, uid, null, "delete", success, failure);
    },

    getPending: function(dataset_id, cb) {
      self.getDataSet(dataset_id, function(dataset) {
        var res;
        if( dataset ) {
          res = dataset.pending;
        }
        cb(res);
      }, function(err, datatset_id) {
          self.consoleLog(err);
      });
    },

    clearPending: function(dataset_id, cb) {
      self.getDataSet(dataset_id, function(dataset) {
        dataset.pending = {};
        self.saveDataSet(dataset_id, cb);
      });
    },

    listCollisions : function(dataset_id, success, failure){
      self.getDataSet(dataset_id, function(dataset) {
        self.doCloudCall({
          "dataset_id": dataset_id,
          "req": {
            "fn": "listCollisions",
            "meta_data" : dataset.meta_data
          }
        }, success, failure);
      }, failure);
    },

    removeCollision: function(dataset_id, colissionHash, success, failure) {
      self.getDataSet(dataset_id, function(dataset) {
        self.doCloudCall({
          "dataset_id" : dataset_id,
          "req": {
            "fn": "removeCollision",
            "hash": colissionHash,
            meta_data: dataset.meta_data
          }
        }, success, failure);
      });
    },

    /**
     * Allows to override default method for checking if application is online
     *
     * @param handlerFunction - function that checks if network is available
     */
    setNetworkStatusHandler: function(handlerFunction){
      if (handler && typeof handler === "function") {
        self.isOnline = handler;
      } else {
        self.consoleLog("setNetworkStatusHandler called  with wrong parameter");
      }
    },
    
    // PRIVATE FUNCTIONS
    /**
     * Check if client is online. 
     * Function is used to stop sync from executing requests.
     */
    isOnline: function(callback) {
      var online = true;

      // first, check if navigator.online is available
      if(typeof navigator.onLine !== "undefined"){
        online = navigator.onLine;
      }

      // second, check if Phonegap is available and has online info
      if(online){
        //use phonegap to determin if the network is available
        if(typeof navigator.network !== "undefined" && typeof navigator.network.connection !== "undefined"){
          var networkType = navigator.network.connection.type;
          if(networkType === "none" || networkType === null) {
            online = false;
          }
        }
      }

      return callback(online);
    },

    doNotify: function(dataset_id, uid, code, message) {

      if( self.notify_callback || self.notify_callback_map[dataset_id]) {
        var notifyFunc = self.notify_callback_map[dataset_id] || self.notify_callback;
        if ( self.config['notify_' + code] ) {
          var notification = {
            "dataset_id" : dataset_id,
            "uid" : uid,
            "code" : code,
            "message" : message
          };
          // make sure user doesn't block
          setTimeout(function () {
            notifyFunc(notification);
          }, 0);
        }
      }
    },

    getDataSet: function(dataset_id, success, failure) {
      var dataset = self.datasets[dataset_id];

      if (dataset) {
        success(dataset);
      } else {
        if(failure){
          failure('unknown_dataset ' + dataset_id, dataset_id);
        }
      }
    },

    getQueryParams: function(dataset_id, success, failure) {
      var dataset = self.datasets[dataset_id];

      if (dataset) {
        success(dataset.query_params);
      } else {
        if(failure){
          failure('unknown_dataset ' + dataset_id, dataset_id);
        }
      }
    },

    setQueryParams: function(dataset_id, queryParams, success, failure) {
      var dataset = self.datasets[dataset_id];

      if (dataset) {
        dataset.query_params = queryParams;
        self.saveDataSet(dataset_id);
        if( success ) {
          success(dataset.query_params);
        }
      } else {
        if ( failure ) {
          failure('unknown_dataset ' + dataset_id, dataset_id);
        }
      }
    },

    getMetaData: function(dataset_id, success, failure) {
      var dataset = self.datasets[dataset_id];

      if (dataset) {
        success(dataset.meta_data);
      } else {
        if(failure){
          failure('unknown_dataset ' + dataset_id, dataset_id);
        }
      }
    },

    setMetaData: function(dataset_id, metaData, success, failure) {
      var dataset = self.datasets[dataset_id];

      if (dataset) {
        dataset.meta_data = metaData;
        self.saveDataSet(dataset_id);
        if( success ) {
          success(dataset.meta_data);
        }
      } else {
        if( failure ) {
          failure('unknown_dataset ' + dataset_id, dataset_id);
        }
      }
    },

    getConfig: function(dataset_id, success, failure) {
      var dataset = self.datasets[dataset_id];

      if (dataset) {
        success(dataset.config);
      } else {
        if(failure){
          failure('unknown_dataset ' + dataset_id, dataset_id);
        }
      }
    },

    setConfig: function(dataset_id, config, success, failure) {
      var dataset = self.datasets[dataset_id];

      if (dataset) {
        var fullConfig = self.setOptions(dataset.config, config);
        dataset.config = fullConfig;
        self.saveDataSet(dataset_id);
        if( success ) {
          success(dataset.config);
        }
      } else {
        if( failure ) {
          failure('unknown_dataset ' + dataset_id, dataset_id);
        }
      }
    },

    stopSync: function(dataset_id, success, failure) {
      self.setConfig(dataset_id, {"sync_active" : false}, function() {
        if( success ) {
          success();
        }
      }, failure);
    },

    startSync: function(dataset_id, success, failure) {
      self.setConfig(dataset_id, {"sync_active" : true}, function() {
        if( success ) {
          success();
        }
      }, failure);
    },

    doSync: function(dataset_id, success, failure) {
      var dataset = self.datasets[dataset_id];

      if (dataset) {
        dataset.syncPending = true;
        self.saveDataSet(dataset_id);
        if( success ) {
          success();
        }
      } else {
        if( failure ) {
          failure('unknown_dataset ' + dataset_id, dataset_id);
        }
      }
    },

    forceSync: function(dataset_id, success, failure) {
      var dataset = self.datasets[dataset_id];

      if (dataset) {
        dataset.syncForced = true;
        self.saveDataSet(dataset_id);
        if( success ) {
          success();
        }
      } else {
        if( failure ) {
          failure('unknown_dataset ' + dataset_id, dataset_id);
        }
      }
    },

    sortObject : function(object) {
      if (typeof object !== "object" || object === null) {
        return object;
      }

      var result = [];

      Object.keys(object).sort().forEach(function(key) {
        result.push({
          key: key,
          value: self.sortObject(object[key])
        });
      });

      return result;
    },

    sortedStringify : function(obj) {

      var str = '';

      try {
        str = JSON.stringify(self.sortObject(obj));
      } catch (e) {
        console.error('Error stringifying sorted object:' + e);
      }

      return str;
    },

    generateHash: function(object) {
      var hash = self.getHashMethod(self.sortedStringify(object));
      return hash.toString();
    },

    shouldResendInflightPending: function(dataSet, pendingRecord) {
      if (dataSet.config && dataSet.config.resend_inflight_pendings_minutes > 0 && pendingRecord.inFlight && pendingRecord.inFlightDate && !pendingRecord.crashed) {
        var now = new Date().getTime();
        var elapsedSinceSubmission = now - pendingRecord.inFlightDate;
        if ( elapsedSinceSubmission >= dataSet.config.resend_inflight_pendings_minutes * MILLISECONDS_IN_MINUTE) {
          return true;
        }
      }

      return false;
    },

    addPendingObj: function(dataset_id, uid, data, action, success, failure) {
      self.isOnline(function (online) {
        if (!online) {
          self.doNotify(dataset_id, uid, self.notifications.OFFLINE_UPDATE, action);
        }
      });

      function storePendingObject(obj) {
        obj.hash = obj.hash || self.generateHash(obj);

        self.getDataSet(dataset_id, function(dataset) {

          dataset.pending[obj.hash] = obj;

          self.updateDatasetFromLocal(dataset, obj);

          if(self.config.auto_sync_local_updates) {
            dataset.syncPending = true;
          }
          self.saveDataSet(dataset_id, function() {
            self.doNotify(dataset_id, uid, self.notifications.LOCAL_UPDATE_APPLIED, action);
          });

          success(obj);
        }, function(code, msg) {
          if(failure) {
            failure(code, msg);
          }
        });
      }

      var pendingObj = {};
      pendingObj.inFlight = false;
      pendingObj.action = action;
      pendingObj.post = JSON.parse(JSON.stringify(data));
      pendingObj.postHash = self.generateHash(pendingObj.post);
      pendingObj.timestamp = new Date().getTime();
      if( "create" === action ) {
        //this hash value will be returned later on when the cloud returns updates. We can then link the old uid
        //with new uid
        pendingObj.hash = self.generateHash(pendingObj);
        pendingObj.uid = pendingObj.hash;
        storePendingObject(pendingObj);
      } else {
        self.read(dataset_id, uid, function(rec) {
          pendingObj.uid = uid;
          pendingObj.pre = rec.data;
          pendingObj.preHash = self.generateHash(rec.data);
          storePendingObject(pendingObj);
        }, function(code, msg) {
          if(failure){
            failure(code, msg);
          }
        });
      }
    },

    syncLoop: function(dataset_id) {
      self.getDataSet(dataset_id, function(dataSet) {
      
        // The sync loop is currently active
        dataSet.syncPending = false;
        dataSet.syncRunning = true;
        dataSet.syncLoopStart = new Date().getTime();
        self.doNotify(dataset_id, null, self.notifications.SYNC_STARTED, null);

        self.isOnline(function(online) {
          if (!online) {
            self.syncComplete(dataset_id, "offline", self.notifications.SYNC_FAILED);
          } else {
              var syncLoopParams = {};
              syncLoopParams.fn = 'sync';
              syncLoopParams.dataset_id = dataset_id;
              syncLoopParams.query_params = dataSet.query_params;
              syncLoopParams.config = dataSet.config;
              syncLoopParams.meta_data = dataSet.meta_data;
              //var datasetHash = self.generateLocalDatasetHash(dataSet);
              syncLoopParams.dataset_hash = dataSet.hash;
              syncLoopParams.acknowledgements = dataSet.acknowledgements || [];

              var pending = dataSet.pending;
              var pendingArray = [];
              for(var i in pending ) {
                // Mark the pending records we are about to submit as inflight and add them to the array for submission
                // Don't re-add previous inFlight pending records who whave crashed - i.e. who's current state is unknown
                // Don't add delayed records
                if( !pending[i].inFlight && !pending[i].crashed && !pending[i].delayed) {
                  pending[i].inFlight = true;
                  pending[i].inFlightDate = new Date().getTime();
                  pendingArray.push(pending[i]);
                }
                if( self.shouldResendInflightPending(dataSet, pending[i]) ) {
                  pendingArray.push(pending[i]);
                }
              }
              syncLoopParams.pending = pendingArray;

              if( pendingArray.length > 0 ) {
                self.consoleLog('Starting sync loop - global hash = ' + dataSet.hash + ' :: params = ' + JSON.stringify(syncLoopParams, null, 2));
              }
              self.doCloudCall({
                'dataset_id': dataset_id,
                'req': syncLoopParams
              }, function(res) {
                var rec;

                function processUpdates(updates, notification, acknowledgements) {
                  if( updates ) {
                    for (var up in updates) {
                      rec = updates[up];
                      acknowledgements.push(rec);
                      if( dataSet.pending[up] && dataSet.pending[up].inFlight) {
                        delete dataSet.pending[up];
                        self.doNotify(dataset_id, rec.uid, notification, rec);
                      }
                    }
                  }
                }

                // Check to see if any previously crashed inflight records can now be resolved
                self.updateCrashedInFlightFromNewData(dataset_id, dataSet, res);

                //Check to see if any delayed pending records can now be set to ready
                self.updateDelayedFromNewData(dataset_id, dataSet, res);

                //Check meta data as well to make sure it contains the correct info
                self.updateMetaFromNewData(dataset_id, dataSet, res);


                if (res.updates) {
                  var acknowledgements = [];
                  self.checkUidChanges(dataSet, res.updates.applied);
                  processUpdates(res.updates.applied, self.notifications.REMOTE_UPDATE_APPLIED, acknowledgements);
                  processUpdates(res.updates.failed, self.notifications.REMOTE_UPDATE_FAILED, acknowledgements);
                  processUpdates(res.updates.collisions, self.notifications.COLLISION_DETECTED, acknowledgements);
                  dataSet.acknowledgements = acknowledgements;
                }

                if (res.hash && res.hash !== dataSet.hash) {
                  self.consoleLog("Local dataset stale - syncing records :: local hash= " + dataSet.hash + " - remoteHash=" + res.hash);
                  // Different hash value returned - Sync individual records
                  self.syncRecords(dataset_id);
                } else {
                  self.consoleLog("Local dataset up to date");
                  self.syncComplete(dataset_id,  "online", self.notifications.SYNC_COMPLETE);
                }
              }, function(msg, err) {
                // The AJAX call failed to complete succesfully, so the state of the current pending updates is unknown
                // Mark them as "crashed". The next time a syncLoop completets successfully, we will review the crashed
                // records to see if we can determine their current state.
                self.markInFlightAsCrashed(dataSet);
                self.consoleLog("syncLoop failed : msg=" + msg + " :: err = " + err);
                self.syncComplete(dataset_id, msg, self.notifications.SYNC_FAILED);
              });
          }
        });
      });
    },

    syncRecords: function(dataset_id) {

      self.getDataSet(dataset_id, function(dataSet) {

        var localDataSet = dataSet.data || {};

        var clientRecs = {};
        for (var i in localDataSet) {
          var uid = i;
          var hash = localDataSet[i].hash;
          clientRecs[uid] = hash;
        }

        var syncRecParams = {};

        syncRecParams.fn = 'syncRecords';
        syncRecParams.dataset_id = dataset_id;
        syncRecParams.query_params = dataSet.query_params;
        syncRecParams.clientRecs = clientRecs;

        self.consoleLog("syncRecParams :: " + JSON.stringify(syncRecParams));

        self.doCloudCall({
          'dataset_id': dataset_id,
          'req': syncRecParams
        }, function(res) {
          self.consoleLog('syncRecords Res before applying pending changes :: ' + JSON.stringify(res));
          self.applyPendingChangesToRecords(dataSet, res);
          self.consoleLog('syncRecords Res after apply pending changes :: ' + JSON.stringify(res));

          var i;

          if (res.create) {
            for (i in res.create) {
              localDataSet[i] = {"hash" : res.create[i].hash, "data" : res.create[i].data};
              self.doNotify(dataset_id, i, self.notifications.RECORD_DELTA_RECEIVED, "create");
            }
          }
          
          if (res.update) {
            for (i in res.update) {
              localDataSet[i].hash = res.update[i].hash;
              localDataSet[i].data = res.update[i].data;
              self.doNotify(dataset_id, i, self.notifications.RECORD_DELTA_RECEIVED, "update");
            }
          }
          if (res['delete']) {
            for (i in res['delete']) {
              delete localDataSet[i];
              self.doNotify(dataset_id, i, self.notifications.RECORD_DELTA_RECEIVED, "delete");
            }
          }

          self.doNotify(dataset_id, res.hash, self.notifications.DELTA_RECEIVED, 'partial dataset');

          dataSet.data = localDataSet;
          if(res.hash) {
            dataSet.hash = res.hash;
          }
          self.syncComplete(dataset_id, "online", self.notifications.SYNC_COMPLETE);
        }, function(msg, err) {
          self.consoleLog("syncRecords failed : msg=" + msg + " :: err=" + err);
          self.syncComplete(dataset_id, msg, self.notifications.SYNC_FAILED);
        });
      });
    },

    syncComplete: function(dataset_id, status, notification) {

      self.getDataSet(dataset_id, function(dataset) {
        dataset.syncRunning = false;
        dataset.syncLoopEnd = new Date().getTime();
        self.saveDataSet(dataset_id, function() {
          self.doNotify(dataset_id, dataset.hash, notification, status);
        });
      });
    },

    applyPendingChangesToRecords: function(dataset, records){
      var pendings = dataset.pending;
      for(var pendingUid in pendings){
        if(pendings.hasOwnProperty(pendingUid)){
          var pendingObj = pendings[pendingUid];
          var uid = pendingObj.uid;
          //if the records contain any thing about the data records that are currently in pendings,
          //it means there are local changes that haven't been applied to the cloud yet,
          //so update the pre value of each pending record to relect the latest status from cloud
          //and remove them from the response
          if(records.create){
            var creates = records.create;
            if(creates && creates[uid]){
              delete creates[uid];
            }
          }
          if(records.update){
            var updates = records.update;
            if(updates && updates[uid]){
              delete updates[uid];
            }
          }
          if(records['delete']){
            var deletes = records['delete'];
            if(deletes && deletes[uid]){
              delete deletes[uid];
            }
          }
        }
      }
    },

    checkUidChanges: function(dataset, appliedUpdates){
      if(appliedUpdates){
        var new_uids = {};
        var changeUidsCount = 0;
        for(var update in appliedUpdates){
          if(appliedUpdates.hasOwnProperty(update)){
            var applied_update = appliedUpdates[update];
            var action = applied_update.action;
            if(action && action === 'create'){
              //we are receving the results of creations, at this point, we will have the old uid(the hash) and the real uid generated by the cloud
              var newUid = applied_update.uid;
              var oldUid = applied_update.hash;
              changeUidsCount++;
              //remember the mapping
              self.uid_map[oldUid] = newUid;
              new_uids[oldUid] = newUid;
              //update the data uid in the dataset
              var record = dataset.data[oldUid];
              if(record){
                dataset.data[newUid] = record;
                delete dataset.data[oldUid];
              }

              //update the old uid in meta data
              var metaData = dataset.meta[oldUid];
              if(metaData) {
                dataset.meta[newUid] = metaData;
                delete dataset.meta[oldUid];
              }
            }
          }
        }
        if(changeUidsCount > 0){
          //we need to check all existing pendingRecords and update their UIDs if they are still the old values
          for(var pending in dataset.pending){
            if(dataset.pending.hasOwnProperty(pending)){
              var pendingObj = dataset.pending[pending];
              var pendingRecordUid = pendingObj.uid;
              if(new_uids[pendingRecordUid]){
                pendingObj.uid = new_uids[pendingRecordUid];
              }
            }
          }
        }
      }
    },

    checkDatasets: function() {
      for( var dataset_id in self.datasets ) {
        if( self.datasets.hasOwnProperty(dataset_id) ) {
          var dataset = self.datasets[dataset_id];
          if(dataset && !dataset.syncRunning && (dataset.config.sync_active || dataset.syncForced)) {
            // Check to see if it is time for the sync loop to run again
            var lastSyncStart = dataset.syncLoopStart;
            var lastSyncCmp = dataset.syncLoopEnd;
            if(dataset.syncForced){
              dataset.syncPending = true;
            } else if( lastSyncStart == null ) {
              self.consoleLog(dataset_id +' - Performing initial sync');
              // Dataset has never been synced before - do initial sync
              dataset.syncPending = true;
            } else if (lastSyncCmp != null) {
              var timeSinceLastSync = new Date().getTime() - lastSyncCmp;
              var syncFrequency = dataset.config.sync_frequency * 1000;
              if( timeSinceLastSync > syncFrequency ) {
                // Time between sync loops has passed - do another sync
                dataset.syncPending = true;
              }
            }

            if( dataset.syncPending ) {
              // Reset syncForced in case it was what caused the sync cycle to run.
              dataset.syncForced = false;

              // If the dataset requres syncing, run the sync loop. This may be because the sync interval has passed
              // or because the sync_frequency has been changed or because a change was made to the dataset and the
              // immediate_sync flag set to true
              self.syncLoop(dataset_id);
            }
          }
        }
      }
    },

    /**
     * Sets cloud handler for sync responsible for making network requests:
     * For example function(params, success, failure)
     */
    setCloudHandler: function(cloudHandler) {
      if (cloudHandler && typeof cloudHandler === "function") {
        self.cloudHandler = cloudHandler;
      } else {
        self.consoleLog("setCloudHandler called  with wrong parameter");
      }
    },

    doCloudCall: function(params, success, failure) {
      if(self.cloudHandler && typeof self.cloudHandler === "function" ){
        if (params && params.req) {
          params.req.__fh = {
            cuid: clientId
          };
        }
        self.cloudHandler(params, success, failure);
      } else {
        console.log("Missing cloud handler for sync. Please refer to documentation");
      }
    },

    datasetMonitor: function() {
      self.checkDatasets();

      // Re-execute datasetMonitor every 500ms so we keep invoking checkDatasets();
      setTimeout(function() {
        self.datasetMonitor();
      }, 500);
    },
    
    /** Allow to set custom storage adapter **/
    setStorageAdapter: function(adapter){
      self.getStorageAdapter = adapter;
    },

    /** Allow to set custom hasing method **/
    setHashMethod: function(method) {
      if (method && typeof method === "function") {
        self.getHashMethod = method;
      } else {
        self.consoleLog("setHashMethod called  with wrong parameter");
      }
    },
    
    getStorageAdapter: function (dataset_id, isSave, cb) {
      var onFail = function(err){
        var notifyMsg = err && err.message === 'OPEN_DB_ERROR' ? self.notifications.CONNECTION_TO_STORAGE_FAILED: self.notifications.CLIENT_STORAGE_FAILED;
        err = err || new Error('storage error');
        var msg = err.message || err;
        var errMsg = (isSave?'save to': 'load from' ) + ' local storage failed msg: ' + msg;
        self.doNotify(dataset_id, null, notifyMsg, msg);
        self.consoleLog(errMsg);
      };
     
      Lawnchair({
        name: id,
        fail: onFail, 
        adapter: self.config.storage_strategy, 
        size: self.config.file_system_quota, 
        backup: self.config.icloud_backup
      }, function(){
        return cb(null, this);
      });
    },

    getHashMethod: CryptoJS.SHA1,

    saveDataSet: function (dataset_id, cb) {
      self.getDataSet(dataset_id, function(dataset) {
        self.getStorageAdapter(dataset_id, true, function(err, storage){
          storage.save({ key: "dataset_" + dataset_id, val: dataset }, function () {
            //close connection [at this point, for indexed DB only]
            if (typeof storage.close === 'function') {
              storage.close();
            }
            //save success
            if (cb) {
              return cb();
            }
          });
        });
      });
    },

    loadDataSet: function (dataset_id, success, failure) {
      self.getStorageAdapter(dataset_id, false, function(err, storage){
        storage.get( "dataset_" + dataset_id, function (data){
          if (data && data.val) {
            var dataset = data.val;
            if(typeof dataset === "string"){
              dataset = JSON.parse(dataset);
            }
            // Datasets should not be auto initialised when loaded - the mange function should be called for each dataset
            // the user wants sync
            dataset.initialised = false;
            self.datasets[dataset_id] = dataset; // TODO: do we need to handle binary data?
            self.consoleLog('load from local storage success for dataset_id :' + dataset_id);
            if(success) {
              return success(dataset);
            }
          } else {
            // no data yet, probably first time. failure calback should handle this
            if(failure) {
              return failure();
            }
          }
        });
      });
    },

    clearCache: function(dataset_id, cb){
      delete self.datasets[dataset_id];
      self.notify_callback_map[dataset_id] = null;
      self.getStorageAdapter(dataset_id, true, function(err, storage){
        storage.remove("dataset_" + dataset_id, function(){
          self.consoleLog('local cache is cleared for dataset : ' + dataset_id);
          if(cb){
            return cb();
          }
        });
      });
    },

    updateDatasetFromLocal: function(dataset, pendingRec) {
      var pending = dataset.pending;
      var previousPendingUid;
      var previousPending;

      var uid = pendingRec.uid;
      self.consoleLog('updating local dataset for uid ' + uid + ' - action = ' + pendingRec.action);

      dataset.meta[uid] = dataset.meta[uid] || {};

      // Creating a new record
      if( pendingRec.action === "create" ) {
        if( dataset.data[uid] ) {
          self.consoleLog('dataset already exists for uid in create :: ' + JSON.stringify(dataset.data[uid]));

          // We are trying to do a create using a uid which already exists
          if (dataset.meta[uid].fromPending) {
            // We are trying to create on top of an existing pending record
            // Remove the previous pending record and use this one instead
            previousPendingUid = dataset.meta[uid].pendingUid;
            delete pending[previousPendingUid];
          }
        }
        dataset.data[uid] = {};
      }

      if( pendingRec.action === "update" ) {
        if( dataset.data[uid] ) {
          if (dataset.meta[uid].fromPending) {
            self.consoleLog('updating an existing pending record for dataset :: ' + JSON.stringify(dataset.data[uid]));
            // We are trying to update an existing pending record
            previousPendingUid = dataset.meta[uid].pendingUid;
            previousPending = pending[previousPendingUid];
            if(previousPending) {
              if(!previousPending.inFlight){
                self.consoleLog('existing pre-flight pending record = ' + JSON.stringify(previousPending));
                // We are trying to perform an update on an existing pending record
                // modify the original record to have the latest value and delete the pending update
                previousPending.post = pendingRec.post;
                previousPending.postHash = pendingRec.postHash;
                delete pending[pendingRec.hash];
                // Update the pending record to have the hash of the previous record as this is what is now being
                // maintained in the pending array & is what we want in the meta record
                pendingRec.hash = previousPendingUid;
              } else {
                //we are performing changes to a pending record which is inFlight. Until the status of this pending record is resolved,
                //we should not submit this pending record to the cloud. Mark it as delayed.
                self.consoleLog('existing in-inflight pending record = ' + JSON.stringify(previousPending));
                pendingRec.delayed = true;
                pendingRec.waiting = previousPending.hash;
              }
            }
          }
        }
      }

      if( pendingRec.action === "delete" ) {
        if( dataset.data[uid] ) {
          if (dataset.meta[uid].fromPending) {
            self.consoleLog('Deleting an existing pending record for dataset :: ' + JSON.stringify(dataset.data[uid]));
            // We are trying to delete an existing pending record
            previousPendingUid = dataset.meta[uid].pendingUid;
            previousPending = pending[previousPendingUid];
            if( previousPending ) {
              if(!previousPending.inFlight){
                self.consoleLog('existing pending record = ' + JSON.stringify(previousPending));
                if( previousPending.action === "create" ) {
                  // We are trying to perform a delete on an existing pending create
                  // These cancel each other out so remove them both
                  delete pending[pendingRec.hash];
                  delete pending[previousPendingUid];
                }
                if( previousPending.action === "update" ) {
                  // We are trying to perform a delete on an existing pending update
                  // Use the pre value from the pending update for the delete and
                  // get rid of the pending update
                  pendingRec.pre = previousPending.pre;
                  pendingRec.preHash = previousPending.preHash;
                  pendingRec.inFlight = false;
                  delete pending[previousPendingUid];
                }
              } else {
                self.consoleLog('existing in-inflight pending record = ' + JSON.stringify(previousPending));
                pendingRec.delayed = true;
                pendingRec.waiting = previousPending.hash;
              }
            }
          }
          delete dataset.data[uid];
        }
      }

      if( dataset.data[uid] ) {
        dataset.data[uid].data = pendingRec.post;
        dataset.data[uid].hash = pendingRec.postHash;
        dataset.meta[uid].fromPending = true;
        dataset.meta[uid].pendingUid = pendingRec.hash;
      }
    },

    updateCrashedInFlightFromNewData: function(dataset_id, dataset, newData) {
      var updateNotifications = {
        applied: self.notifications.REMOTE_UPDATE_APPLIED,
        failed: self.notifications.REMOTE_UPDATE_FAILED,
        collisions: self.notifications.COLLISION_DETECTED
      };

      var pending = dataset.pending;
      var resolvedCrashes = {};
      var pendingHash;
      var pendingRec;


      if( pending ) {
        for( pendingHash in pending ) {
          if( pending.hasOwnProperty(pendingHash) ) {
            pendingRec = pending[pendingHash];

            if( pendingRec.inFlight && pendingRec.crashed) {
              self.consoleLog('updateCrashedInFlightFromNewData - Found crashed inFlight pending record uid=' + pendingRec.uid + ' :: hash=' + pendingRec.hash );
              if( newData && newData.updates && newData.updates.hashes) {

                // Check if the updates received contain any info about the crashed in flight update
                var crashedUpdate = newData.updates.hashes[pendingHash];
                if( !crashedUpdate ) {
                  //TODO: review this - why we need to wait?
                  // No word on our crashed update - increment a counter to reflect another sync that did not give us
                  // any update on our crashed record.
                  if( pendingRec.crashedCount ) {
                    pendingRec.crashedCount++;
                  }
                  else {
                    pendingRec.crashedCount = 1;
                  }
                }
              }
              else {
                // No word on our crashed update - increment a counter to reflect another sync that did not give us
                // any update on our crashed record.
                if( pendingRec.crashedCount ) {
                  pendingRec.crashedCount++;
                }
                else {
                  pendingRec.crashedCount = 1;
                }
              }
            }
          }
        }

        for( pendingHash in pending ) {
          if( pending.hasOwnProperty(pendingHash) ) {
            pendingRec = pending[pendingHash];

            if( pendingRec.inFlight && pendingRec.crashed) {
              if( pendingRec.crashedCount > dataset.config.crashed_count_wait ) {
                self.consoleLog('updateCrashedInFlightFromNewData - Crashed inflight pending record has reached crashed_count_wait limit : ' + JSON.stringify(pendingRec));
                self.consoleLog('updateCrashedInFlightFromNewData - Retryig crashed inflight pending record');
                pendingRec.crashed = false;
                pendingRec.inFlight = false;
              }
            }
          }
        }
      }
    },

    updateDelayedFromNewData: function(dataset_id, dataset, newData){
      var pending = dataset.pending;
      var pendingHash;
      var pendingRec;
      if(pending){
        for( pendingHash in pending ){
          if( pending.hasOwnProperty(pendingHash) ){
            pendingRec = pending[pendingHash];
            if( pendingRec.delayed && pendingRec.waiting ){
              self.consoleLog('updateDelayedFromNewData - Found delayed pending record uid=' + pendingRec.uid + ' :: hash=' + pendingRec.hash + ' :: waiting=' + pendingRec.waiting);
              if( newData && newData.updates && newData.updates.hashes ){
                var waitingRec = newData.updates.hashes[pendingRec.waiting];
                if(waitingRec){
                  self.consoleLog('updateDelayedFromNewData - Waiting pending record is resolved rec=' + JSON.stringify(waitingRec));
                  pendingRec.delayed = false;
                  pendingRec.waiting = undefined;
                }
              }
            }
          }
        }
      }
    },

    updateMetaFromNewData: function(dataset_id, dataset, newData){
      var meta = dataset.meta;
      if(meta && newData && newData.updates && newData.updates.hashes){
        for(var uid in meta){
          if(meta.hasOwnProperty(uid)){
            var metadata = meta[uid];
            var pendingHash = metadata.pendingUid;
            self.consoleLog("updateMetaFromNewData - Found metadata with uid = " + uid + " :: pendingHash = " + pendingHash);
            var pendingResolved = true;
    
            if(pendingHash){
              //we have current pending in meta data, see if it's resolved
              pendingResolved = false;
              var hashresolved = newData.updates.hashes[pendingHash];
              if(hashresolved){
                self.consoleLog("updateMetaFromNewData - Found pendingUid in meta data resolved - resolved = " + JSON.stringify(hashresolved));
                //the current pending is resolved in the cloud
                metadata.pendingUid = undefined;
                pendingResolved = true;
              }
            }

            if(pendingResolved){
              self.consoleLog("updateMetaFromNewData - both previous and current pendings are resolved for meta data with uid " + uid + ". Delete it.");
              //all pendings are resolved, the entry can be removed from meta data
              delete meta[uid];
            }
          }
        }
      }
    },


    markInFlightAsCrashed : function(dataset) {
      var pending = dataset.pending;
      var pendingHash;
      var pendingRec;

      if( pending ) {
        var crashedRecords = {};
        for( pendingHash in pending ) {
          if( pending.hasOwnProperty(pendingHash) ) {
            pendingRec = pending[pendingHash];

            if( pendingRec.inFlight ) {
              self.consoleLog('Marking in flight pending record as crashed : ' + pendingHash);
              pendingRec.crashed = true;
              crashedRecords[pendingRec.uid] = pendingRec;
            }
          }
        }
      }
    },

    consoleLog: function(msg) {
      if( self.config.do_console_log ) {
        console.log(msg);
      }
    }
  };

  (function() {
    self.config = self.defaults;
  })();

  self.setCloudHandler(defaultCloudHandler.handler);

  return {
    init: self.init,
    manage: self.manage,
    notify: self.notify,
    doList: self.list,
    getUID: self.getUID,
    doCreate: self.create,
    doRead: self.read,
    doUpdate: self.update,
    doDelete: self['delete'],
    listCollisions: self.listCollisions,
    removeCollision: self.removeCollision,
    getPending : self.getPending,
    clearPending : self.clearPending,
    getDataset : self.getDataSet,
    getQueryParams: self.getQueryParams,
    setQueryParams: self.setQueryParams,
    getMetaData: self.getMetaData,
    setMetaData: self.setMetaData,
    getConfig: self.getConfig,
    setConfig: self.setConfig,
    startSync: self.startSync,
    stopSync: self.stopSync,
    doSync: self.doSync,
    forceSync: self.forceSync,
    generateHash: self.generateHash,
    loadDataSet: self.loadDataSet,
    clearCache: self.clearCache,
    doCloudCall: self.doCloudCall,
    setCloudHandler: self.setCloudHandler,
    setStorageAdapter: self.setStorageAdapter,
    setHashMethod: self.setHashMethod,
    setNetworkStatusHandler : self.setNetworkStatusHandler
  };
}