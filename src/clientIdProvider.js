var uuidGenerator = require('uuid').v1;
var CLIENT_ID_TAG = "feedhenry_sync_client";

/**
 * Get unique client id for current browser/platform/user
 */
function getClientId() {
    if (window && window.device) {
        return window.device.uuid;
    }
    if (navigator && navigator.device) {
        return navigator.device.uuid;
    }
    if (window && window.localStorage) {
        var clientId = window.localStorage.getItem(CLIENT_ID_TAG);
        if (!clientId) {
            clientId = uuidGenerator();
            localStorage.setItem(CLIENT_ID_TAG, clientId);
        }
        return clientId;
    } else {
        throw Error("Cannot create and store client id");
    }
}

module.exports = {
    getClientId: getClientId
};