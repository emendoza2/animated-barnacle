const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/database.db');
const database = require('../lib/db');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const PDFDocument = require('pdfkit');

const foodRatios = [
    ["Pizza", 0.35],
    ["Pasta", 0.25],
    ["Chicken", 0.25],
    ["Free Admission", 0],
    ["Dessert", 0.15],
    ["Pineapple", 0]
];

function select() {
    let randomNumber = Math.random();
    let i = 0;
    while (randomNumber > foodRatios[i][1]) {
        randomNumber -= foodRatios[i][1];
        i++;
    }
    return i;
}   

//TODO: FIX PROMISES
// A super simple api that returns people's teams and automagically assigns them teams.


async function save(personName) {
    try {
        return new Promise(async (resolve, reject) => {
            const row = await database.get(db, 'SELECT (id) FROM teams ORDER BY memberCount');
            let teamId = row.id;
            let foodChoice = foodRatios[select()][1];
            database.run(db, 'INSERT INTO people (name, teamNumber, foodChoice) VALUES (?, ?, ?)', [personName, teamId, foodChoice]);
            database.run(db, 'UPDATE teams SET memberCount = memberCount + 1 WHERE id = ?', [teamId]);
            let newRow = { newPerson: true, teamNumber: teamId };
            resolve(newRow);
        });
    }
    catch (err) {
        return console.log(err);
    }
}

function sendAsPNG(response, canvas) {

    var stream = canvas.createPNGStream();
    console.log(stream);
    response.setHeader('Content-Type', 'image/png');
    stream.pipe(response);

};

router.get('/', async function (req, res) {
    let personName = req.query.n || req.query.tt_order_id;
    if (!personName) {
        res.send(res.render('index', { title: 'Welcome to PPP!' }));
        return;
    }
    let row = await database.get(db, 'SELECT teamNumber FROM people WHERE name = ?', [personName]);
    let teamName;
    if (typeof row === "undefined") row = await save(personName);
    let team = await database.get(db, 'SELECT name FROM teams WHERE id = ?', row.teamNumber);
    teamName = team.name;
    res.render('ppp', { title: "Your PPP Team", teamName });
});

router.get('/img', async function (req, res) {
    let personName = req.query.n || req.query.tt_order_id;
    if (!personName) {
        res.send(res.render('index', { title: 'Welcome to PPP!' }));
        return;
    }
    let row = await database.get(db, 'SELECT teamNumber FROM people WHERE name = ?', [personName]);
    let teamName;
    if (typeof row === "undefined") row = await save(personName);
    let team = await database.get(db, 'SELECT name FROM teams WHERE id = ?', row.teamNumber);
    teamName = team.name;
    var canvas = createCanvas(200, 50);
    var context = canvas.getContext("2d");
    context.fillStyle = "#FFF";
    context.fillRect(0, 0, 200, 100);
    context.fillStyle = "#000";
    context.font = "12px Helvetica";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(teamName, 10, canvas.height / 2);
    sendAsPNG(res, canvas);
});

router.get('/ticket', async function (req, res) {
    let query = req.query;
    let personName = query.name;
    if (!personName) {
        res.send(res.render('index', { title: 'Welcome to PPP!' }));
        return;
    }
    let row = await database.get(db, 'SELECT teamNumber, foodChoice FROM people WHERE name = ?', [personName]);
    if (typeof row === "undefined") {
        row = await save(personName);
    } else {
        let teamNumber = row.teamNumber;
        let foodChoice = row.foodChoice;
    }
    const doc = new PDFDocument;
    doc.pipe(res);
    doc.fontSize(48);
    doc.font('Helvetica-Bold');
    doc.text('Ticket for '+req.query.name);
    
    doc.end();
});

router.get('/person', async function (req, res) {
    let personName = req.query.n;
    if (!personName) {
        res.send(res.render('index', { title: 'Welcome to PPP!' }));
        return;
    }
    let row = await database.get(db, 'SELECT teamNumber FROM people WHERE name = ?', [personName]);
    if (typeof row === "undefined") {
        save(personName)
            .then(row => {
                res.send(row);
            })
            .catch(err => new Error(err));
    } else {
        let teamNumber = row.teamNumber;
        res.send(row);
    }
});

router.get('/database/teams', (_, res) => database.all(db, 'SELECT * FROM teams').then(row => res.send(row)));
router.get('/database/people', (_, res) => database.all(db, 'SELECT * FROM people').then(row => res.send(row)));
router.get(/database\/exports\/.+\.csv/,
    (req, res) => {
        var filename = req.path.split("/").pop();
        res.sendFile(filename, { root: path.join(__dirname, '../data/exports') });
    }
);

module.exports = router;
