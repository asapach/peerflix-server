REST API
========

Endpoint | Description
--- | ---
`GET /torrents` | will return the list of all torrents
`GET /torrents/{infoHash}` | will return one torrent
`GET /torrents/{infoHash}/archive` | will return the ZIP archive
`GET /torrents/{infoHash}/files` | will return the M3U playlist
`GET /torrents/{infoHash}/files/{path}` | will start streaming the file (honoring the `Range` header)
`GET /torrents/{infoHash}/stats` | will return the torrent stats (speed, bandwidth, etc.)
`POST /torrents/{infoHash}/pause` and <br>`POST /torrents/{infoHash}/resume` | will pause/resume the swarm and peer discovery
`POST /torrents/{infoHash}/start` and <br>`POST /torrents/{infoHash}/stop` | will start/stop the download by selecting/deselecting all files
`POST /torrents/{infoHash}/start/{index}` and <br>`POST /torrents/{infoHash}/stop/{index}` | will start/stop downloading a particular file (by index)
`POST /torrents` | will add a new torrent (`{"link":"magnet link or URL"}`)
`POST /upload` | will accept a .torrent file as an attachment (`file` field in `multipart/form-data`)
`DELETE /torrents/{infoHash}` | will delete the torrent
