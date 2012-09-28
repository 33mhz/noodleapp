# NoodleApp

![NoodleApp](http://f.cl.ly/items/2i062B0R2T1t302T423y/NoodleApp-4.jpg)
![NoodleApp](http://f.cl.ly/items/3R0G3E1b3j1t0H0C1C2e/NoodleApp-5.jpg)

An http://app.net web client.

## Installation instructions

#FIRST. SIGN UP TO [http://app.net](http://app.net) WITH A DEVELOPER ACCOUNT (or this will all be a waste of time)

Create the app.net app

> go to [https://alpha.app.net/developer/apps/](https://alpha.app.net/developer/apps/)

> click "Create an App"

> enter the application name: noodleapp-dev

> enter the website: http://dev.noodletalk.org:3000

> enter the callback url: http://dev.noodletalk.org:3000/auth/appdotnet/callback

> click "Create", you will need the client id and client secret below

Edit /etc/hosts

> Add the following: 127.0.0.1 dev.noodletalk.org

Clone the repository

> git clone git://github.com/ednapiranha/noodleapp.git

Install node through the website http://nodejs.org/#download

> cd noodleapp

> cp local.json-dist local.json

> change the domain in local.json to: http://dev.noodletalk.org

> copy and paste your app.net client id and secret to local.json under 'appnet_consumer_key' and 'appnet_consumer_secret'

> adjust redis databases accordingly on local.json

> npm install

Run the site

> node app.js

> go to http://dev.noodletalk.org:3000

## Tests

> make test

Current status on `master`: [![Build Status](https://secure.travis-ci.org/ednapiranha/noodleapp.png?branch=master)](http://travis-ci.org/ednapiranha/noodleapp)
