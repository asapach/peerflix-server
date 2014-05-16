peerflix-server
===============

[![Build Status](https://travis-ci.org/asapach/peerflix-server.svg?branch=master)](https://travis-ci.org/asapach/peerflix-server)

Streaming torrent client for node.js with web ui.

Based on [torrent-stream](/mafintosh/torrent-stream), inspired by [peerflix](/mafintosh/peerflix).

## Usage

1. `npm install -g peerflix-server`
1. `peerflix-server`
1. Open your browser at [http://localhost:9000/](http://localhost:9000/)
1. Enjoy!

## Configuration

You can configure the application using `~/.config/peerflix-server/config.json` file (doesn't exist by default). The [options](https://github.com/mafintosh/torrent-stream#full-api) are passed to all torrent-stream instances. Here's an example that overrides the defaults:

```json
{
  "connections": 50,
  "dht": 1000,
  "tmp": "/mnt/torrents"
}
```

The application stores its current state (list of torrents) in `~/.config/peerflix-server/torrents.json`

## Development

If you wish to build and run the code from source, here's what you'll need:

### Prerequisites

Install all local modules: `npm install`

Install Grunt and Bower: `npm install -g grunt-cli bower`

Download all required 3rd-party dependencies like Angular, jQuery and Bootstrap: `bower install`

### Running development server

`grunt serve`

The task will first perform all required pre-processing, enable watch, live-reload, jshint and karma, and then open the browser.
If you don't want any of this fancy stuff, you can just run `node server/bin.js`

### Building production-ready application

`grunt build`

This task will optimize and minimize all the assets and prepare the code for deployment (e.g. to npm registry). You can run the production version locally by using `grunt serve:dist`

### Unit tests

`grunt test`

This task will start Karma test runner and report the results.

### JSHint

`grunt jshint`

This task will run code analysis and report the results.
