var express = require('express');
var router = express.Router();
const { MongoClient } = require('mongodb');
const assert = require('assert');

const url = 'mongodb://localhost:27017';
const dbName = 'drawv';


/* GET home page. */
router.get('/', function(req, res, next) 
{
    res.render('db', { title: 'db' });
});

router.post('/saveSketch', async function(req, res, next) 
{
    //console.log(req.body);
    /*client.connect( async (err, client) => 
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
    })    */
    const client = new MongoClient(url,{ useUnifiedTopology: true });
    try {
        await client.connect();
        const db = client.db(dbName);
        console.log("Connected successfully");
    
        let r = await db.collection('sketches').insertOne({
            drawstring : JSON.stringify(req.body),
            timestamp : new Date()
        });
        assert.equal(1, r.insertedCount);
        
    }
    catch(err){
        console.log(err.stack);
    }
    finally{
        await client.close();
    }
});

router.get('/getSketch', async function(req, res, next) 
{
    /*client.connect( async (err, client) => 
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
    })    */
    //db.sketches.find().sort({timestamp:1})
    const client = new MongoClient(url,{ useUnifiedTopology: true });
    try {
        console.log("test1");
        await client.connect();
        console.log("test2");
        const db = client.db(dbName);
        console.log("Connected successfully");
        let cursor = await db.collection('sketches').find().sort({timestamp:-1});
        if(await cursor.hasNext()){
            let result = await cursor.next();
            res.send(result);
            await cursor.close();
        }
    }
    catch(err){
        console.log(err.stack);
    }
    finally{
        console.log("test3");
        await client.close();
    }

});

router.get('/getGallery', function (req, res, next) 
{

});

module.exports = router;
