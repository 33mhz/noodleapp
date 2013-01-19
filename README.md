# NoodleApp

## Support us by donating!

<a href='http://www.pledgie.com/campaigns/18407'><img alt='Click here to lend your support to: NoodleApp - an app.net web client and make a donation at www.pledgie.com !' src='http://www.pledgie.com/campaigns/18407.png?skin_name=chrome' border='0' /></a>

Donating enables us to continually add new awesome features and keep the server running fast like bunnies!

![NoodleApp](http://dl.dropbox.com/u/1913694/noodleapp/screen1.jpg)

An http://app.net web client.

## To use the client

Go here and sign in: http://app.noodletalk.org

Ignore everything below.

## Installation instructions (if you want to hack on the code)

# SIGN UP TO [http://app.net](http://app.net) WITH A DEVELOPER ACCOUNT

### Create the app.net app

> go to [https://alpha.app.net/developer/apps/](https://alpha.app.net/developer/apps/)

> click "Create an App"

> enter the application name: noodleapp-dev

> enter the website: http://dev.noodletalk.org:3000

> enter the callback url: http://dev.noodletalk.org:3000/auth/appdotnet/callback

> click "Create", you will need the client id and client secret below

> Ensure you have selected "Current" API for all migrations:

![AppNetSettings](http://i.pau.lk/Jwgz/Screen%20Shot%202012-10-05%20at%202.33.17%20PM.png)

### Edit /etc/hosts

> Add the following: 127.0.0.1 dev.noodletalk.org

### Clone the repository

> git clone git://github.com/noodle/noodleapp.git

Install node through the website http://nodejs.org/#download

> cd noodleapp

> cp local.json-dist local.json

> change the domain in local.json to: http://dev.noodletalk.org

> copy and paste your app.net client id and secret to local.json under 'appnet_consumer_key' and 'appnet_consumer_secret'

> adjust redis databases accordingly on local.json

> npm install

### Run the site

> node app.js

> go to http://dev.noodletalk.org:3000

## Tests

> make test

Current status on `master`: [![Build Status](https://secure.travis-ci.org/ednapiranha/noodleapp.png?branch=master)](http://travis-ci.org/ednapiranha/noodleapp)
