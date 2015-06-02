FROM node:0.10-slim

ENV NODE_ENV production

RUN npm install -g forever

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install --production
COPY . /usr/src/app

EXPOSE 8080

CMD [ "forever", "server/app.js" ]
