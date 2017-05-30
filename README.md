FeedHenry Sync Javascript client
========================
 
[Note] This repository it's currently in development for production version
please refer to fh-js-sdk npm module.

## Building

The JS SDK is now built using [Browserify](http://browserify.org/).

### Development

Because of Browserify, you can write any new functions as normal node modules, and use node's "require" to load any other modules, or to be consumed by other modules.

### Testing

Write your tests in test/tests directory. Add the tests to test/browser/suite.js file and run

```
grunt test
```

This will use mocha and phatomjs to run the tests.

In fact, if your module and test don't require a browser environment, you can just run them purely in node. (You may need to add a new grunt task to run them).

To help debugging, you can run

```
grunt local
```

This will start mock servers locally and you can go to http://localhost:8200/example/index.html page to debug. You may want to run

```
grunt watch
```

In another terminal window to auto generate the combined js sdk file.

### Build

When finish developing and testing, run

```
grunt
```
To generate the release builds.
