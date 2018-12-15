peerflix-server
===============

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][travis-image]][travis-url]

<img src="https://cdn.jsdelivr.net/gh/asapach/peerflix-server@master/app/images/logo.svg" alt="logo" height="256">

Streaming torrent client for node.js with web ui.

![screen capture](https://cdn.jsdelivr.net/gh/asapach/peerflix-server@master/capture.gif)

Based on [torrent-stream](https://github.com/mafintosh/torrent-stream), inspired by [peerflix](https://github.com/mafintosh/peerflix).

## Usage

1. `npm install -g peerflix-server`
1. `peerflix-server`
1. Open your browser at [http://localhost:9000/](http://localhost:9000/)
1. Enjoy!

## Configuration

You can configure the application using `~/.config/peerflix-server/config.json` file (doesn't exist by default).
The [options](https://github.com/mafintosh/torrent-stream#full-api) are passed to all torrent-stream instances.
Here's an example that overrides the defaults:

```json
{
  "connections": 50,
  "tmp": "/mnt/torrents"
}
```

You can also change the default port by setting `PORT` environment variable:

```sh
PORT=1234 peerflix-server

# or on windows
SET PORT=1234
peerflix-server
```

The application stores its current state (list of torrents) in `~/.config/peerflix-server/torrents.json`

## Daemon

If you want to run peerflix-server as a daemon, you can do it using [forever](https://github.com/foreverjs/forever):

```sh
npm install -g forever
```

```sh
forever start $(which peerflix-server)
```

You might also want to enable logging -- see the [docs](https://github.com/foreverjs/forever#command-line-usage).

## FAQ

[How do I add password protection?](https://github.com/asapach/peerflix-server/wiki/How-to-put-a-password-on-peerflix-server)

## Development

See [Development.md](Development.md)

## REST API

See [REST.md](REST.md)

## Docker

See [Docker.md](Docker.md)

[npm-image]: https://img.shields.io/npm/v/peerflix-server.svg?style=flat
[npm-url]: https://npmjs.org/package/peerflix-server
[node-version-image]: https://img.shields.io/node/v/peerflix-server.svg?style=flat
[node-version-url]: http://nodejs.org/download/
[travis-image]: https://img.shields.io/travis/asapach/peerflix-server.svg?style=flat
[travis-url]: https://travis-ci.org/asapach/peerflix-server
[downloads-image]: https://img.shields.io/npm/dm/peerflix-server.svg?style=flat
[downloads-url]: https://npmjs.org/package/peerflix-server
