var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data/database.db');
var database = require('../lib/db');

//TODO: FIX PROMISES
// A super simple api that returns people's teams and automagically assigns them teams.


function save(personName) {
    return new Promise((resolve, reject) => {
        console.log("Getting...");
        db.get('SELECT (id) FROM teams ORDER BY memberCount', 
            (err, row) => {
                if (err) reject(err);
                let teamId = row.id;
                database.run(db, 'INSERT INTO people (name, teamNumber) VALUES (?, ?)', [personName, teamId]);
                database.run(db, 'UPDATE teams SET memberCount = memberCount + 1 WHERE id = ?', [teamId]);
                let newRow = {newPerson: true, teamNumber: teamId};
                resolve(newRow);
            });
    })
}

router.get('/person', function (req, res) {
    let personName = req.query.n;
    database.get(db, 'SELECT teamNumber FROM people WHERE name = ?', [personName])
        .then((row) => {
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
        })
        .catch(err => new Error(err));
});

router.get('/database/teams', (_, res) => database.all(db, 'SELECT * FROM teams').then(row => res.send(row)));
router.get('/database/people', (_, res) => database.all(db, 'SELECT * FROM people').then(row => res.send(row))); 

module.exports = router;