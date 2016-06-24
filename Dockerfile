FROM php:7.0-apache

RUN apt-get update && apt-get -y install nodejs npm

RUN docker-php-ext-install bcmath

# Create app directory
WORKDIR /var/www/html

COPY . /var/www/html
RUN npm install
