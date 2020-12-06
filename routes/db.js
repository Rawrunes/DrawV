var express = require('express');
var router = express.Router();

const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectID;
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
    execute(async (db) => 
    {
        let verify = req.body.drawstring.filter( e => {
            return (
                width !== 3 &&
                !( color === "0x000000" || color === "0xFFFFFF")
            );
        });
        assert.equal(0, verify.length);
        let r = await db.collection('sketches').insertOne({
            timestamp : new Date(),
            respose_id : req.body.responseid,
            drawstring : JSON.stringify(req.body.drawstring)
        });
        assert.equal(1, r.insertedCount);
    })
});

router.get('/getSketch/:id?', async function(req, res, next) 
{
    execute(async (db) => 
    {
        let cursor;
        
        if(req.params.id){
            cursor = await db.collection('sketches').find({_id : ObjectId(req.params.id)});
            if(await cursor.hasNext()){
                let result = await cursor.next();
                res.send(result);
                await cursor.close();
            }
        }
        else{
            cursor = await db.collection('sketches').find().sort({timestamp:-1});
            if(await cursor.hasNext()){
                let result = await cursor.next();
                res.send(result);
                await cursor.close();
            }
        }     
    })
});

router.get('/getGallery', function (req, res, next) 
{
    execute(async (db) => {
        let sketches = await db.collection('sketches').find({}).sort({timestamp:-1}).toArray();
        res.send(sketches);
    })
});

async function execute(command)
{
    const client = new MongoClient(url,{ useUnifiedTopology: true });
    try {
        await client.connect();
        const db = client.db(dbName);
    
        await command(db);
        
    }
    catch(err){
        console.log(err.stack);
    }
    finally{
        await client.close();
    }    
}

module.exports = router;
