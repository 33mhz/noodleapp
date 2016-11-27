# NoodleApp

## Support Edna Piranha by donating!

<a href='http://www.pledgie.com/campaigns/18407'><img alt='Click here to lend your support to: NoodleApp - an app.net web client and make a donation at www.pledgie.com !' src='http://www.pledgie.com/campaigns/18407.png?skin_name=chrome' border='0' /></a>

Donating enables us to continually add new awesome features and keep the server running fast like bunnies!

A https://pnut.io client.

## To use the client

Go here and sign in: http://noodle.s3rv.com [no longer: http&lt;colon>//app&lt;dot>noodletalk&lt;dot>org]

Ignore everything below.

## Installation instructions (if you want to hack on the code)

## SIGN UP TO [https://pnut.io](https://pnut.io)

[A DEVELOPER ACCOUNT is required]

### Create the pnut.io app

> go to https://pnut.io/dev

> enter the application name: noodleapp-dev

> enter the website: http://dev.noodletalk.org

> enter the callback url: http://dev.noodletalk.org/auth/appdotnet/callback

> click "Create", you will need the client id and client secret below

### Edit /etc/hosts

> Add the following: 127.0.0.1 dev.noodletalk.org

### Clone the repository

> git clone git://github.com/33mhz/noodleapp.git

### Install redis

If you have brew you can just install with

> brew install redis

### Install node

Install node through the website http://nodejs.org/#download

> cd noodleapp

> cp local.json-dist local.json

> change the domain in local.json to: http://dev.noodletalk.org

> copy and paste your app.net client id and secret to local.json under 'appnet_consumer_key' and 'appnet_consumer_secret'

> adjust redis databases accordingly on local.json ( if using non-default port for redis, adjust in node_modules/redis/index.js )

> npm install

### Run the site

> node app.js

> go to http://dev.noodletalk.org

## Tests

> make test
