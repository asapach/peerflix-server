# Alpine is a lightweight Linux
FROM mhart/alpine-node:8

WORKDIR /app
# Update latest available packages
RUN apk update && \
    apk add ffmpeg && \
    apk add git && \
    rm -rf /var/cache/apk/* /tmp/* && \
    mkdir /tmp/torrent-stream && \
    npm install -g grunt-cli bower

COPY . .

RUN npm install && \
    bower install && \
    grunt build

VOLUME [ "/tmp/torrent-stream" ]
EXPOSE 6881 9000

CMD [ "npm", "start" ]
