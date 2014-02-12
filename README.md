SnapSearch-Client-Node
======================

[![Build Status](https://travis-ci.org/SnapSearch/SnapSearch-Client-Node.png?branch=master)](https://travis-ci.org/SnapSearch/SnapSearch-Client-Node)

Snapsearch Client Node is Node.js based framework agnostic HTTP client library for SnapSearch (https://snapsearch.io/).

SnapSearch provides similar libraries in other languages: https://github.com/SnapSearch/Snapsearch-Clients

Installation
------------

Usage
-----

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