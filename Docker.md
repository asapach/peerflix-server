Docker
========

`docker pull stefanlendl/peerflix-server`

Make sure that you have write permissions to your destination directory `/tmp/torrent-stream`.

`docker run -p 9000:9000 -p 6881:6881 -p 6881:6881/udp --cap-add=NET_ADMIN \
--rm -d -v /tmp/torrent-stream:/tmp/torrent-stream \
-v ~/.config/peerflix-server:/home/app/.config/peerflix-server \
stefanlendl/peerflix-server`

This Docker image includes openvpn. Add your config to `~/.config/peerflix-server/vpn.ovpn`.
This is so far only tested when accessing through localhost.

systemd
========

To run the docker container as a system service with systemd install the `peerflix-server.service` unit file to `/etc/systemd/system/`.
Afterwards reloading the systemd daemon you can start and enable the unit.
The configuration for peerflix-server needs to be put into `/etc/peerflix-server`. This can be
adapted by changing the StartExec line in the unit file.
`
sudo cp peerflix-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start peerflix-server.service
sudo systemctl enable peerflix-server.service
`
