/**
 * Module for creating a custom cloud handler for sync. This can be used when
 * a user needs to add custom headers to each sync request, handle successful
 * and failed sync responses in different ways.
 */

var _ = require('underscore');

function createCloudHandler(baseUrl, options) {

  // Ensure the properties we use actually exist. This will not overwrite
  // values, these values will only be used when a value is undefined.
  options = _.defaults(options, {
    cloudPath: '/',
    headers: []
  });

  return function(params, success, failure) {
    var url = baseUrl + options.cloudPath + params.dataset_id;
    var payload = JSON.stringify(params.req);
    var xhr = new XMLHttpRequest();

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    _.forEach(options.headers, function(header) {
      xhr.setRequestHeader(header.name, header.value);
    });

    xhr.onreadystatechange = function() {
      if(xhr.readyState === XMLHttpRequest.DONE) {
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
          try {
            var responseJson = JSON.parse(xhr.responseText);
            return success(xhr.responseJson);
          } catch(e) {
            return failure(e);
          }
        }
        return failure(xhr.responseText);
      }
    };
    xhr.send(payload);
  };
}

module.exports = createCloudHandler;
