REST API
========

Endpoint | Description
`GET /torrents` | will return the list of all torrents
`GET /torrents/{infoHash}` | will return one torrent
`GET /torrents/{infoHash}/stats` | will return the torrent stats (speed, bandwidth, etc.)
`GET /torrents/{infoHash}/files` | will return the M3U playlist
`GET /torrents/{infoHash}/files/{path} | will start streaming the file (honoring the `Range` header)
`POST /torrents` | will add a new torrent (`{"link":"magnet link or URL"}`)
`DELETE /torrents/{infoHash} | will delete the torrent
