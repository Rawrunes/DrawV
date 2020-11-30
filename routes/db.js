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
    res.render('db', { title: 'db' });
});

router.post('/saveSketch', function(req, res, next) 
{
    //console.log(req.body);
    client.connect( async (err, client) => 
    {
        assert.equal(null, err);
        console.log("Connected successfully");

        const db = client.db(dbName);

        db.collection('sketches').insertOne({
            drawstring : JSON.stringify(req.body),
            timestamp : new Date()
        }, (err, response) =>
        {
            assert.equal(null, err);
            assert.equal(1, response.insertedCount);

            console.log(response);
        })
        //client.close();
    })    
});

router.get('/getSketch', function(req, res, next) 
{
    client.connect( async (err, client) => 
    {
        assert.equal(null, err);
        console.log("Connected successfully");

        const db = client.db(dbName);
        var test;

        var cursor = db.collection('sketches').find().sort({timestamp:-1});
        while (await cursor.hasNext()) {
            //console.log(await cursor.next());
            test = await cursor.next();
            res.send(test);
            cursor.close();
            
            break;
        }
        //client.close();
    })    
    //db.sketches.find().sort({timestamp:1})
});

router.get('/getGallery', function (req, res, next) 
{

});

module.exports = router;
