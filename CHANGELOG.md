# Changelog - fh-sync-js lib
## 1.4.3 - 2019-11-12
## Change
- Add the missing flag for the `CONNECTION_TO_STORAGE_FAILED` notification

## 1.4.2 - 2019-11-08
## Change
- Add a new `CONNECTION_TO_STORAGE_FAILED` notification if the sync client can't connect to index-db

## 1.4.1 - 2019-11-07
## Change
- Emit an error if it takes too long to open index-db.

## 1.4.0 - 2019-04-15
## Change
- Change in the Storage Adapter in order to allow it works with IOS 12 webkit update. (IOS 12 still not supported by RHMAP) 

## 1.3.2 - 2018-09-27
## Fix
- Fix intermittent issue where sync events are sent before the action be actually performed.

## 1.3.1 - 2018-06-12
## Change
- Remove unused moment dependency
- Add Changelog
