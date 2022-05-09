const express = require('express');
const session = require('express-session')
const sqlite3 = require('sqlite3').verbose();
const morgan = require('morgan');

const app = express();

app.use(morgan('dev'));

app.set('view engine', 'pug');
app.use(express.static('public'));

app.use(session({
    secret: "$sECreT^~TraCk!D*B$",
    saveUninitialized: true,
    resave: true,
    cookie: {maxAge: 1000 * 60 * 30}
}));

const NO_VALUE_COUNT_QUERY = 70;

let db = new sqlite3.Database('data.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        process.exit(1);
    }
});

async function db_all(sql) {
    return new Promise((resolve, reject) => {
        db.all(sql, (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

app.listen(3000, () => {
    console.log('Listening at http://localhost:3000');
});

app.get('/', (req, res) => {
    res.render('main')
});

app.get('/api/athletes', (req, res) => {
    let sql;

    if (req.query.hasOwnProperty('name')) {
        sql = `select full_name, birth_year from athlete where full_name like '%${req.query['name']}%'`;
    } else {
        sql = `select full_name, birth_year from athlete order by random() limit ${NO_VALUE_COUNT_QUERY}`;
    }

    db_all(sql).then((data) => {
        res.status(200).send(data);
    }).catch(() => {
        res.sendStatus(500);
    });
});

app.get('/api/clubs', (req, res) => {
    let sql;

    if (req.query.hasOwnProperty('name')) {
        sql = `select club_name from club where club_name like '%${req.query['name']}%'`;
    } else {
        sql = `select club_name from club limit ${NO_VALUE_COUNT_QUERY}`;
    }

    db_all(sql).then((data) => {
        res.status(200).send(data);
    }).catch(() => {
        res.sendStatus(500);
    });
});

app.get('/api/events/subquery', (req, res) => {
    if (req.session.prevEventQuery) {
        if (req.query.hasOwnProperty("year")) {
            let innerSql = `select *, substr(date, 1, 4) as year from (${req.session.prevEventQuery})`;
            let finalSql = `select * from (${innerSql}) where year = '${req.query.year}'`;

            console.log(finalSql);

            db_all(finalSql).then((data) => {
                res.status(200).send(data);
            }).catch(() => {
                res.sendStatus(500);
            });
        } else {
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(440);
    }
});


app.get('/api/events', (req, res) => {
    let sql;

    if (req.query.hasOwnProperty('name')) {
        sql = `select * from event where evt_name like '%${req.query['name']}%'`;
    } else {
        sql = `select * from event limit ${NO_VALUE_COUNT_QUERY}`;
    }

    req.session.prevEventQuery = sql;

    db_all(sql).then((data) => {
        res.status(200).send(data);
    }).catch(() => {
        res.sendStatus(500);
    });
});

app.get('/athlete', async (req, res) => {
    if (req.query.hasOwnProperty('name') && req.query.hasOwnProperty('birth_year')) {
        let club_names = [];

        let sql = `select competes_for_club_name from competes_for where competes_for_athlete_full_name = "${req.query.name}" and competes_for_athlete_birth_year = ${req.query.birth_year}`;

        await db_all(sql).then((data) => {
            if (data.length === 0) {
                res.sendStatus(404);
            } else {
                data.forEach(item => {
                    club_names.push(item.competes_for_club_name)
                });

                sql = `select result_meet_name, result_date, result_evt_name, placement, time from result where result_athlete_full_name = "${req.query.name}" and result_athlete_birth_year = ${req.query.birth_year}`;

                db_all(sql).catch(() => {
                    res.sendStatus(500);
                }).then((data) => {
                    res.render('athlete', {'athlete': req.query.name, 'clubs': club_names, 'results': data});
                });
            }
        }).catch(() => {
            res.sendStatus(404);
        });

    } else {
        res.sendStatus(400);
    }
});

app.get('/club/:clubname', (req, res) => {
    let sql = `select competes_for_athlete_birth_year, competes_for_athlete_full_name from competes_for where competes_for_club_name = "${req.params.clubname}"`;

    db_all(sql).then((data) => {
        if (data.length === 0) {
            res.sendStatus(404);
        } else {
            res.render('club', {'club': req.params.clubname, 'athletes': data})
        }
    }).catch(() => {
        res.sendStatus(404);
    });
});

app.get("/event", (req, res) => {
    if (req.query.hasOwnProperty('event_name') && req.query.hasOwnProperty('date') && req.query.hasOwnProperty('meet')) {
        let sql = `select result_athlete_full_name, result_athlete_birth_year, time, placement from result where result_evt_name = "${req.query.event_name}" and result_meet_name = "${req.query.meet}" and result_date = "${req.query.date}"`;

        db_all(sql).then((data) => {
            if (data.length === 0) {
                res.sendStatus(404);
            } else {
                function comparePlacement(a, b) {
                    if (a.placement < b.placement) { return -1; }
                    if (a.placement > b.placement) { return 1; }
                    return 0;
                }

                data.sort(comparePlacement);

                res.render('event', {'meet': req.query.meet, 'event_name': req.query.event_name, 'date': req.query.date, 'athletes': data});
            }
        }).catch(() => {
            res.sendStatus(404);
        });
    } else {
        res.sendStatus(400);
    }
});