FROM node:16-bullseye-slim

RUN apt-get update && \
    apt-get install --no-install-recommends -y \
    build-essential \
    python3 && \
    rm -fr /var/lib/apt/lists/* && \
    rm -rf /etc/apt/sources.list.d/*

RUN mkdir -p /home/treejer
WORKDIR /home/treejer
COPY . .
RUN npm install --quiet
