#!/bin/bash

git pull

docker ps
docker stop soundlogo
docker rm soundlogo

docker build -t soundlogo .

docker run -d -p 3000:3000 --name soundlogo --mount type=bind,source=/var/www/upload,target=/usr/src/app/temp_uploads soundlogo

docker ps
