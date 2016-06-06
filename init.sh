#!/bin/sh

VPNCONF=/home/app/.config/peerflix-server/vpn.ovpn

if [[ -e ${VPNCONF} ]]; then
  mkdir -p /dev/net
  if [ ! -c /dev/net/tun ]; then
    mknod /dev/net/tun c 10 200
  fi
  sg vpn -c "openvpn --config ${VPNCONF} --daemon"
  echo "nameserver 8.8.8.8" > /etc/resolv.conf
fi

npm start

