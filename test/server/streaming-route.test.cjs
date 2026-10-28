'use strict';

// The target server is loaded only after the real torrent store is replaced by a
// self-authored in-memory fixture. Requests use an ephemeral 127.0.0.1 listener.
const assert = require('node:assert/strict');
const http = require('node:http');
const Module = require('node:module');
const path = require('node:path');
const { Readable } = require('node:stream');
const { test } = require('node:test');

const targetIndex = path.resolve(__dirname, '../../server/index.js');
const syntheticBytes = Buffer.from('self-authored tiny range fixture\n', 'utf8');
const observedStreamRanges = [];
const syntheticFile = {
  name: 'sample.txt',
  path: 'sample.txt',
  length: syntheticBytes.length,
  offset: 0,
  createReadStream(range) {
    observedStreamRanges.push(range);
    if (range && typeof range === 'object') {
      return Readable.from([syntheticBytes.subarray(range.start, range.end + 1)]);
    }
    return Readable.from([syntheticBytes]);
  }
};
const mockTorrent = {
  infoHash: 'selfauthoredfixturehash',
  torrent: { name: 'self-authored-fixture', pieceLength: 16, length: syntheticBytes.length },
  files: [syntheticFile],
  selection: [],
  bitfield: { buffer: Buffer.alloc(1) },
  amInterested: false,
  ready: true
};
const mockStore = {
  get(infoHash) { return infoHash === mockTorrent.infoHash ? mockTorrent : null; },
  list() { return [mockTorrent]; },
  add() { throw new Error('Unexpected real store add'); },
  remove() { throw new Error('Unexpected real store remove'); }
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (parent && parent.filename === targetIndex) {
    if (request === './store') return mockStore;
    if (request === './progressbar') return () => 0;
    if (request === './stats') return () => ({});
    if (request === 'morgan') return () => (_req, _res, next) => next();
    if (request === 'body-parser') return { json: () => (_req, _res, next) => next() };
    if (request === 'multer') return () => ({ single: () => (_req, _res, next) => next() });
    if (request === 'archiver') return () => { throw new Error('Unexpected archive use'); };
  }
  return originalLoad.call(this, request, parent, isMain);
};
let app;
try {
  app = require(targetIndex);
} finally {
  Module._load = originalLoad;
}

function request(server, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port: server.address().port,
      method,
      path: '/torrents/selfauthoredfixturehash/files/sample.txt',
      headers
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString('utf8')
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('streaming file endpoint honors its GET/HEAD contract and synthetic byte ranges', async () => {
  process.env.NODE_ENV = 'test';
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const whole = await request(server);
    assert.equal(whole.status, 200);
    assert.equal(whole.body, syntheticBytes.toString('utf8'));

    const valid = await request(server, 'GET', { Range: 'bytes=1-3' });
    assert.equal(valid.status, 206);
    assert.equal(valid.headers['content-range'], `bytes 1-3/${syntheticBytes.length}`);
    assert.equal(valid.body, syntheticBytes.subarray(1, 4).toString('utf8'));

    const suffix = await request(server, 'GET', { Range: 'bytes=-4' });
    assert.equal(suffix.status, 206);
    assert.equal(suffix.headers['content-range'], `bytes ${syntheticBytes.length - 4}-${syntheticBytes.length - 1}/${syntheticBytes.length}`);
    assert.equal(suffix.body, syntheticBytes.subarray(-4).toString('utf8'));

    const unsatisfiable = await request(server, 'GET', { Range: `bytes=${syntheticBytes.length + 10}-` });
    assert.equal(unsatisfiable.status, 200);
    assert.equal(unsatisfiable.body, syntheticBytes.toString('utf8'));

    const malformed = await request(server, 'GET', { Range: 'bytes=not-a-range' });
    assert.equal(malformed.status, 200);
    assert.equal(malformed.body, syntheticBytes.toString('utf8'));

    const head = await request(server, 'HEAD', { Range: 'bytes=1-3' });
    assert.equal(head.status, 206);
    assert.equal(head.headers['content-range'], `bytes 1-3/${syntheticBytes.length}`);
    assert.equal(head.body, '');

    const post = await request(server, 'POST');
    assert.equal(post.status, 404);

    assert.deepEqual(observedStreamRanges, [undefined, { start: 1, end: 3 }, { start: syntheticBytes.length - 4, end: syntheticBytes.length - 1 }, undefined, undefined]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
