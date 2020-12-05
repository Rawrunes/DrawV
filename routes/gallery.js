var express = require('express');
var router = express.Router();

const { MongoClient } = require('mongodb');
const assert = require('assert');

const url = 'mongodb://localhost:27017';
const dbName = 'drawv';

/* GET gallery page. */
router.get('/', function(req, res, next) {
  res.render('gallery', { title: 'Gallery' });
});

module.exports = router;
