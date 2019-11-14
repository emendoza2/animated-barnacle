const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/database.db');
const database = require('../lib/db');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const PDFDocument = require('pdfkit');
const fs = require('fs');

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
            let foodChoice = foodRatios[select()][0];
            database.run(db, 'INSERT INTO people (name, teamNumber, foodChoice) VALUES (?, ?, ?)', [personName, teamId, foodChoice]);
            database.run(db, 'UPDATE teams SET memberCount = memberCount + 1 WHERE id = ?', [teamId]);
            let newRow = { newPerson: true, teamNumber: teamId, foodChoice };
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
    let orderID = query.tt_order_id;

    // Send a blank page if the order id is not in the request
    if (!orderID) {
        res.send(res.render('index', { title: 'Welcome to PPP!' }));
        return;
    }

    // Ticket tailor is hassle, so "guess" the ticket type and number of attendees based on the order amount
    let willBringFood = query.tt_order_amount % 500 !== 0;
    let numberOfAttendees = query.tt_order_amount / (willBringFood ? 120 : 500);
    
    // Create pdf doc
    const doc = new PDFDocument;
    
    // Pipe to response
    doc.pipe(res);
    
    // Page background
    doc
    .rect(50, 50, doc.page.width - 100, doc.page.height - 100)
    .dash(5, { space: 10 })
    .stroke();
    doc.on('pageAdded', () => {
        doc
        .rect(50, 50, doc.page.width - 100, doc.page.height - 100)
        .dash(5, { space: 10 })
        .stroke();
    });
    
    // For whole slip
    doc
        .fontSize(10)
        .font('Courier')
        .text(query.tt_order_id, 75, 60, {
            align: 'right'
        })

        .fontSize(36)
        .font('Helvetica-Bold')
        .text('PPP Entrance Slip', 75, 75)

        .fontSize(10)
        .fillColor('black', 0.6)
        .moveDown(0.5)
        .font('Helvetica')
        .text('You will need to present this slip to enter the event, along with your ticket which will be sent to your email.')
        
        // Draw first line
        .fontSize(18)
        .moveDown()
        .moveTo(doc.x, doc.y - 5)
        .lineTo(doc.x + doc.page.width - 150, doc.y - 5)
        .dash(5, {space: 10})
        .stroke();;

    // Per attendee
    for (let i = 0; i < numberOfAttendees; i++) {
        // Create an artificial attendee id
        let attendeeID = orderID + i;

        // Select row or save new attendee if not exists
        let row = await database.get(db, 'SELECT teamNumber, foodChoice FROM people WHERE name = ?', [attendeeID]);
        if (typeof row === "undefined") {
            row = await save(attendeeID);
        }

        // Get team from database (TODO: make this more efficient)
        let team = await database.get(db, 'SELECT name FROM teams WHERE id = ?', row.teamNumber);
        let teamName = team.name;

        let foodChoice = row.foodChoice;

        // Write doc per person
        doc
            .fontSize(12)
            .fillColor('black', 0.6)
            .moveDown()
            .font('Helvetica-Bold')
            .text('Person ID')
            .moveDown(0.5)

            .fontSize(18)
            .font('Courier')
            .fillColor('black', 1)
            .text(query.tt_order_id + i)
        
            .fontSize(12)
            .fillColor('black', 0.6)
            .font('Helvetica-Bold')
            .moveDown()
            .text('PPP TEAM')
            .moveDown(0.5)
    
            .fontSize(18)
            .font('Courier')
            .fillColor('black', 1)
            .text(teamName)
        
        // Potluck to bring for those who will bring food
        if (willBringFood) {
            doc
                .moveDown()
                .fillColor('black', 0.6)
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('POTLUCK TO BRING')
                .moveDown(0.5)
    
                .fontSize(18)
                .fillColor('black', 1)
                .font('Courier')
                .text(foodChoice)
        }

        doc
            .moveDown()
            .moveTo(doc.x, doc.y - 5)
            .lineTo(doc.x + doc.page.width - 150, doc.y - 5)
            .dash(5, {space: 10})
            .stroke();
    }

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
