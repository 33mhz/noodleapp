# NoodleApp

## Support Edna Piranha by donating!

<a href='http://www.pledgie.com/campaigns/18407'><img alt='Click here to lend your support to: NoodleApp - an app.net web client and make a donation at www.pledgie.com !' src='http://www.pledgie.com/campaigns/18407.png?skin_name=chrome' border='0' /></a>

Donating enables us to continually add new awesome features and keep the server running fast like bunnies!

![NoodleApp](https://files.app.net/rlwj9k3k)

An http://app.net web client.

## To use the client

Go here and sign in: http://pastapp.net [no longer: http&lt;colon>//app&lt;dot>noodletalk&lt;dot>org]

Ignore everything below.

## Installation instructions (if you want to hack on the code)

## SIGN UP TO [http://app.net](http://app.net)

[A DEVELOPER ACCOUNT is required only for multi-user deployment]

### Create the app.net app

> go to [https://alpha.app.net/developer/apps/](https://alpha.app.net/developer/apps/)

> click "Create an App"

> enter the application name: noodleapp-dev

> enter the website: http://dev.noodletalk.org:3000

> enter the callback url: http://dev.noodletalk.org:3000/auth/appdotnet/callback

> click "Create", you will need the client id and client secret below

### Edit /etc/hosts

> Add the following: 127.0.0.1 dev.noodletalk.org

### Clone the repository

> git clone git://github.com/cdn/noodleapp.git

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

> go to http://dev.noodletalk.org:3000

## Tests

> make test
