FROM python:3.14-alpine

# get ffmpeg+ffprobe
RUN apk add --no-cache ffmpeg

# install local flux build
COPY ./backend/dist /dist
RUN find /dist -type f -name "*.whl" -exec pip install --no-cache-dir {} \;
RUN rm -r /dist

# setup index
ENV INDEX_LOCATION=/var/local/flux/index
RUN mkdir -p ${INDEX_LOCATION}

# create default user and set permissions
RUN addgroup -S flux \
    && adduser -S -G flux flux \
    && chown -R flux ${INDEX_LOCATION}

# set default user
USER flux:flux

LABEL description="a simple web-application which allows you to easily host your own video streaming platform at home"
LABEL homepage="https://github.com/RichtersFinger/flux"
EXPOSE 8620
CMD ["flux", "run", "--auto-create"]
