var express = require('express');
var router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const url = 'mongodb://localhost:27017';
const dbName = 'drawv';

const client = new MongoClient(url);

/* GET home page. */
router.get('/', function(req, res, next) 
{
    client.connect( (err, client) => 
    {
        assert.equal(null, err);
        console.log("Connected successfully");

        const db = client.db(dbName);

        db.collection('sketches').insertOne({a:2}, (err, response) =>
        {
            assert.equal(null, err);
            assert.equal(1, response.insertedCount);

            console.log(response);
        })
        client.close();
    })
    res.render('db', { title: 'db' });
});

router.post('/saveSketch', function(req, res, next) 
{

});

router.get('/getSketch', function(req, res, next) 
{

});

router.get('/getGallery', function (req, res, next) 
{

});

module.exports = router;
