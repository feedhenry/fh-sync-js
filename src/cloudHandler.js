var cloudURL;
var cloudPath;

/**
 * Default sync cloud handler responsible for 
 */
var handler = function (params, success, failure) {
    if (!cloudPath) {
        // Default server sync api route
        cloudPath = '/mbaas/sync/';
    }
    var url = cloudURL + cloudPath + params.dataset_id;
    var json = JSON.stringify(params.req);

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

var init = function (url, path) {
    cloudURL = url;
    cloudPath = path;
};

module.exports = {
    handler: handler,
    init: init
};