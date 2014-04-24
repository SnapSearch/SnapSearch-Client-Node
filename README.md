SnapSearch-Client-Node
======================

[![Build Status](https://travis-ci.org/SnapSearch/SnapSearch-Client-Node.png?branch=master)](https://travis-ci.org/SnapSearch/SnapSearch-Client-Node)

Snapsearch Client Node is Node.js based framework agnostic HTTP client library for SnapSearch (https://snapsearch.io/).

Snapsearch is a search engine optimisation (SEO) and robot proxy for complex front-end javascript & AJAX enabled (potentially realtime) HTML5 web applications.

Search engines like Google's crawler and dumb HTTP clients such as Facebook's image extraction robot cannot execute complex javascript applications. Complex javascript applications include websites that utilise AngularJS, EmberJS, KnockoutJS, Dojo, Backbone.js, Ext.js, jQuery, JavascriptMVC, Meteor, SailsJS, Derby, RequireJS and much more. Basically any website that utilises javascript in order to bring in content and resources asynchronously after the page has been loaded, or utilises javascript to manipulate the page's content while the user is viewing them such as animation.

Snapsearch intercepts any requests made by search engines or robots and sends its own javascript enabled robot to extract your page's content and creates a cached snapshot. This snapshot is then passed through your own web application back to the search engine, robot or browser.

Snapsearch's robot is an automated load balanced Firefox browser. This Firefox browser is kept up to date with the nightly versions, so we'll always be able to serve the latest in HTML5 technology. Our load balancer ensures your requests won't be hampered by other user's requests.

For more details on how this works and the benefits of usage see https://snapsearch.io/

SnapSearch provides similar libraries in other languages: https://github.com/SnapSearch/Snapsearch-Clients

Installation
------------

Install it from NPM.

```
npm install snapsearch-client-nodejs --save
```

Usage
-----

Check the examples folder.

Development
-----------

Install/update all dependencies:

```
npm install
```

Make your changes. Then use this to create a version in the package.json, ti also creates a new git tag.

```
npm version [<newversion> | major | minor | patch] -m "New release"
```

Synchronise and push the tag with:

```
git push
git push --tags
```

Push the version to NPM:

```
npm publish
```

Tests
----

Unit tests are written using Mocha and Chai. To run tests use `npm test`.

To run tests in Windows use `./node_modules/.bin/mocha --reporter spec`.

Todo
----

1. Make the client download gzipped version, but also decode properly
2. Update examples onto the README.
3. Write tests for connectInterceptor.