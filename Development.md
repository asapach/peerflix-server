Development
===========

If you wish to build and run the code from source, here's what you'll need:

# Prerequisites

Install Grunt and Bower: `npm install -g grunt-cli bower`

Install all local modules: `npm install`

Install all external dependencies: `bower install`

# Running development server

`grunt serve`

The task will first perform all required pre-processing, enable watch, live-reload, jshint and karma, and then open the browser.
If you don't want any of this fancy stuff, you can just run `npm start`

# Building production-ready application

`grunt build`

This task will optimize and minimize all the assets and prepare the code for deployment (e.g. to npm registry). You can run the production version locally by using `grunt serve:dist`

# Unit tests

`grunt test`

This task will start Karma test runner and report the results.

# JSHint

`grunt jshint`

This task will run code analysis and report the results.
