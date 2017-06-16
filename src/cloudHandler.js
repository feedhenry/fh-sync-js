var cloudURL;
var cloudPath;
var cidProvider = require('./clientIdProvider');

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
        cuid: cidProvider.getClientId()
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
};