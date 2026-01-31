FROM python:3.14-alpine

# get ffmpeg+ffprobe
RUN apk add --no-cache ffmpeg

# install local flux build
COPY ./backend/dist /dist
RUN find /dist -type f -name "*.whl" -exec pip install --no-cache-dir {} \;
RUN rm -r /dist

# setup index
RUN mkdir -p /var/local/flux/index
ENV INDEX_LOCATION=/var/local/flux/index

CMD ["flux", "run", "--auto-create"]
