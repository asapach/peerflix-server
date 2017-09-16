# Alpine is a lightweight Linux
FROM mhart/alpine-node:6

ENV HOME /home/app
# Update latest available packages
RUN apk update && \
    apk add ffmpeg && \
    apk add git && \
    rm -rf /var/cache/apk/* /tmp/* && \
    addgroup app && adduser -D app app && \
    mkdir /tmp/torrent-stream && \
    chown app:app /tmp/torrent-stream && \
    npm install -g grunt-cli bower

WORKDIR $HOME
COPY . $HOME
RUN chown app:app $HOME -R

# run as user app from here on
USER app
RUN npm install && \
    bower install && \
    grunt build

VOLUME [ "/tmp/torrent-stream" ]
EXPOSE 6881 9000

CMD [ "npm", "start" ]
