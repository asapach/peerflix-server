FROM node:onbuild
RUN  npm install -g grunt-cli bower && useradd -m app && chown app:app . -R
USER app
RUN  bower install
VOLUME [ "/tmp/torrent-stream" ]
EXPOSE 9000
