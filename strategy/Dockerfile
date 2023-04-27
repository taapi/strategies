FROM node

# Containers run GMT as default timezone

RUN mkdir -p /var/www/strategy

WORKDIR /var/www/strategy

COPY ./package.json /var/www/strategy
COPY ./version.properties /var/www/strategy

RUN npm install
RUN npm install nodemon