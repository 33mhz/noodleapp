# NoodleApp

![NoodleApp](http://f.cl.ly/items/2L0L2G2i063n073v3x0R/NoodleApp-2.jpg)
![NoodleApp](http://f.cl.ly/items/3a1H121a2l051y350O0k/NoodleApp-3.jpg)

An http://app.net web client.

## Installation instructions

#FIRST. SIGN UP TO [http://app.net](http://app.net) WITH A DEVELOPER ACCOUNT (or this will all be a waste of time)

Clone the repository

> git clone git://github.com/ednapiranha/noodleapp.git

Install node through the website http://nodejs.org/#download

> cd noodleapp

> cp local.json-dist local.json

> copy and paste your app.net client id and secret to local.json under 'appnet_consumer_key' and 'appnet_consumer_secret'

> adjust redis databases accordingly on local.json

> npm install

Run the site

> node app.js

## Tests

> make test