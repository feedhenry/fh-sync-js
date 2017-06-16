// Standard sync setup for simple dataset
var datasetId = "myShoppingList";

//provide sync init options
$fh.sync.init({
    "cloudUrl": "http://localhost:3000",
    "sync_frequency": 10,
    "do_console_log": true,
    "storage_strategy": "dom"
});

//provide listeners for notifications.
$fh.sync.notify(function (notification) {
    var code = notification.code
    if ('sync_complete' === code) {
        //a sync loop completed successfully, list the update data
        $fh.sync.doList(datasetId,
            function (res) {
                console.log('Successful result from list:', JSON.stringify(res));
            },
            function (err) {
                console.log('Error result from list:', JSON.stringify(err));
            });
    } else {
        //choose other notifications the app is interested in and provide callbacks
    }
});

//manage the data set, repeat this if the app needs to manage multiple datasets
var query_params = {}; //or something like this: {"eq": {"field1": "value"}}
var meta_data = {};
$fh.sync.manage(datasetId, {}, query_params, meta_data, function () {
    // Save data
    var data = { name: "Shoppping item1" };
    $fh.sync.doCreate(datasetId, data,
        function (res) {
            console.log('Successful result from list:', JSON.stringify(res));
        },
        function (err) {
            console.log('Error result from list:', JSON.stringify(err));
        });
});