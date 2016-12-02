# NoodleApp

A https://pnut.io client.

## To use the client

Go here and sign in: http://noodle.s3rv.com

Ignore everything below.

## Installation instructions (if you want to hack on the code)

## SIGN UP TO [https://pnut.io](https://pnut.io)

[A DEVELOPER ACCOUNT is required]

### Create the pnut.io app

> go to https://pnut.io/dev

> enter the application name: noodleapp-dev

> enter the website: http://site.example.com

> enter the callback url: http://site.example.com/auth/pnut/callback

> click "Create", you will need the client id and client secret below

### Edit /etc/hosts

> Add the following: 127.0.0.1 site.example.com

> It is recommendable to use a web server like nginx as a proxy in front of noodle, across HTTPS

### Clone the repository

> git clone git://github.com/33mhz/noodleapp.git

### Install redis

If you have brew you can just install with

> brew install redis

### Install node

Install node through the website http://nodejs.org/#download

> cd noodleapp

> cp local.json-dist local.json

> change the domain in local.json to: http://site.example.com

> copy and paste your pnut.io client id and secret to local.json under 'pnut_consumer_key' and 'pnut_consumer_secret'

> adjust redis databases accordingly on local.json ( if using non-default port for redis, adjust in node_modules/redis/index.js )

> npm install

### Run the site

> node app.js

> go to http://site.example.com

## Tests

> make test
