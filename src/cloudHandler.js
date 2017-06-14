var cloudURL;
var cloudPath;

var uuidGenerator = require('uuid').v1;
var CLIENT_ID_TAG = "feedhenry_sync_client";

/**
 * Default sync cloud handler responsible for making all sync requests to 
 * server. 
 */
var handler = function (params, success, failure) {
    if (!cloudPath) {
        // Default server sync api route
        cloudPath = '/sync/';
    }
    var url = cloudURL + cloudPath + params.dataset_id;
    var payload = params.req;
    payload.__fh = {
        cuid: getClientId(payload)
    };
    var json = JSON.stringify(payload);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                var responseJson;
                try {
                    if (xhr.responseText) {
                        responseJson = JSON.parse(xhr.responseText);
                    }
                } catch (e) {
                    return failure(e);
                }
                success(responseJson);
            } else {
                failure(xhr.responseText);
            }
        }
    };
    xhr.send(json);
};

/**
 * Get client id 
 * 
 * @param {*} payload object to add parameter 
 */
function getClientId(payload) {
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


/**
 * Default sync cloud handler init method
 * 
 * @param url - for example http://example.com:7000
 * @param path - api path (will default to '/sync')
 */
var init = function (url, path) {
    cloudURL = url;
    cloudPath = path;
};

module.exports = {
    handler: handler,
    init: init,
    getClientId: getClientId
};