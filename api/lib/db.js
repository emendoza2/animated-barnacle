var sqlite3 = require('sqlite3').verbose();
const { exec } = require('child_process');

const database = {};
database.init = function () {
    var db = new sqlite3.Database('data/database.db');
    var teams = ["Team 1", "Team 2", "Team 3", "Team 4", "Team 5", "Team 6", "Team 7", "Team 8", "Team 9", "Team 10", "Team 11", "Team 12", "Team 13", "Team 14", "Team 15", "Team 16", "Team 17", "Team 18", "Team 19", "Team 20"];
    db.serialize(function () {
        db.run('DROP TABLE IF EXISTS teams');
        db.run('DROP TABLE IF EXISTS people');
        db.run(`CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY, name VARCHAR(255), teamNumber INTEGER, foodChoice VARCHAR(255))`);
        db.run('CREATE TABLE teams (id INTEGER PRIMARY KEY, name VARCHAR(255), memberCount INT default 0)');
        var stmt = db.prepare('INSERT INTO teams (name) VALUES (?)');
        for (let i = 0; i < teams.length; i++) {
            stmt.run(teams[i]);
        }

        stmt.finalize();
    });

    db.close();
};

database.erase = function () {
    var db = new sqlite3.Database('data/database.db');
    db.run('DROP TABLE IF EXISTS teams');
    db.run('DROP TABLE IF EXISTS people');
    db.close();
}

database.run = function (db, sql, params = null) {
    return new Promise((resolve, reject) => {
        let stmt = db.prepare(sql);
        stmt.run(params, (err) => {
            if (err) reject(err);
            resolve();
        });
        stmt.finalize();
        database.export(); //export hook
    });
}

database.get = function (db, sql, params) {
    return new Promise((resolve, reject) => {
        let stmt = db.prepare(sql);
        if (params) {
            stmt.get(params, (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        } else {
            stmt.get((err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        }
        stmt.finalize();
    });
}

database.all = function (db, sql, params) {
    return new Promise((resolve, reject) => {
        let stmt = db.prepare(sql);
        if (params) {
            stmt.all(params, (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        } else {
            stmt.all((err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        }
        stmt.finalize();
    });
}

database.export = function () {
    exec('sqlite3 -header -csv "./data/database.db" "SELECT * FROM teams;" > ./data/exports/teams.csv');
    exec('sqlite3 -header -csv "./data/database.db" "SELECT * FROM people;" > ./data/exports/people.csv');
}

module.exports = database;