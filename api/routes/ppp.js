const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/database.db');
const database = require('../lib/db');
const path = require('path');

//TODO: FIX PROMISES
// A super simple api that returns people's teams and automagically assigns them teams.


function save(personName) {
    return new Promise(async (resolve, reject) => {
        const row = await database.get(db, 'SELECT (id) FROM teams ORDER BY memberCount');
        let teamId = row.id;
        database.run(db, 'INSERT INTO people (name, teamNumber) VALUES (?, ?)', [personName, teamId]);
        database.run(db, 'UPDATE teams SET memberCount = memberCount + 1 WHERE id = ?', [teamId]);
        let newRow = { newPerson: true, teamNumber: teamId };
        resolve(newRow);
    })
}

router.get('/', async function (req, res) {
    let personName = req.query.n;
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

router.get('/person', function (req, res) {
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