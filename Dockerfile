# Alpine is a lightweight Linux
FROM mhart/alpine-node:5

# Update latest available packages
RUN echo "@testing http://nl.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \
    apk update && \
    apk add git openvpn bash shadow@testing && \
    rm -rf /var/cache/apk/* /tmp/* && \
    addgroup -S vpn && \
    mkdir -p /home/app/.config/peerflix-server && \
    mkdir /tmp/torrent-stream && \
    npm install -g grunt-cli bower

WORKDIR /home/app
COPY . .
RUN npm install && \
    bower --allow-root install && \
    grunt build

VOLUME [ "/tmp/torrent-stream" ]
EXPOSE 6881 9000

CMD [ "/home/app/init.sh" ]
