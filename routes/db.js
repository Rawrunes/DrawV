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
                e.width !== 3 ||
                !( e.color === "0x000000" || e.color === "0xFFFFFF")
            );
        });
        if(!verify.length){
            let r = await db.collection('sketches').insertOne({
                timestamp : new Date(),
                respose_id : req.body.responseid,
                drawstring : JSON.stringify(req.body.drawstring)
            });
            assert.equal(1, r.insertedCount);
            res.send("");
        }
        else{
            res.status(406).send("Validation of the line data unsuccessful.");
        }
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

router.get('/getGallery/:index?', function (req, res, next) 
{
    execute(async (db) => {
        let sketches = [];
        let data = await db.collection('sketches').find({}).sort({timestamp:-1}).toArray();
        data = data.slice(req.params.index, req.params.index + 50);
        data.forEach((sketch) => {
            if (sketch.drawstring !== undefined)
            {
                sketches.push(sketch);
            }
        });
        res.send(sketches);
    })
});

router.get('/getResponses/:id', function (req, res, next) 
{
    execute(async (db) => {
        const options = {
            sort: { timestamp : 1},
            projection: { drawstring : 0 }
          };        
        let responses = await db.collection('sketches').find({respose_id: req.params.id }, options).toArray();
        res.send(responses);
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
