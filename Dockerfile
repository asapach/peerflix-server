FROM node:onbuild
RUN  npm install -g grunt-cli bower && useradd -m app && chown app:app . -R
USER app
RUN  bower install && grunt build
RUN  mkdir /tmp/torrent-stream && chown app:app /tmp/torrent-stream
VOLUME [ "/tmp/torrent-stream" ]
EXPOSE 9000
