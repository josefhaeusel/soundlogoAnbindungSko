FROM node:20-bullseye-slim AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

FROM node:20-bullseye-slim AS runtime

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y python3 python3-pip python3-dev \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    libatlas-base-dev \
    gfortran \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* 

COPY requirements.txt .
RUN pip3 install -r requirements.txt

COPY --from=build /usr/src/app .

EXPOSE 3000

CMD ["npm", "start"]

