const express = require("express");
const mysql = require("mysql");
const app = express();
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');

app.use(express.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('view engine', 'hbs');
app.engine('html', require('ejs').renderFile);
app.use(express.static("public"));

app.get('/', function(req, res, next) {
    // delete req.session.username;
    res.render("login.html");
});

app.post('/', function(req, res, next) {
    const connection = mysql.createConnection({
        host: 'jlg7sfncbhyvga14.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
        user: 'qgqifg7oz9sxl8ey',
        password: 's46bb5bu1c8y26hk',
        database: 'yrracjeliqow5h4f'
    });

    connection.connect();

    // CHECKING IS USERNAME AND PASSWORD ARE CORRECT
    connection.query(
        `SELECT username, password FROM users
         WHERE username = '${req.body.username}' AND password = '${req.body.password}'`,
        function(error, results, fields) {
            if (error) throw error;

            // IF THERE ARE NO RESULTS, EITHER WRONG USERNAME/PASSWORD OR DOESNT EXIST
            if(!results.length) {
                connection.end();
                delete req.session.username;

                // RETURN BACK RESULTS - FALSE
                res.json({
                    successful: false,
                    message: 'Wrong username/password or account does not exist'
                });
            }
            else {
                connection.end();
                // req.session.username = req.body.username;

                // RETURN BACK RESULTS - TRUE
                res.json({
                    successful: true,
                    message: ''
                });
            }
        }
    );
});

app.get('/guest', function(req, res, next) {
    const connection = mysql.createConnection({
        host: 'jlg7sfncbhyvga14.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
        user: 'qgqifg7oz9sxl8ey',
        password: 's46bb5bu1c8y26hk',
        database: 'yrracjeliqow5h4f'
    });

    connection.connect();

    connection.query(`SELECT * from schedule`,
        function(error, results, fields) {
            if (error) throw error;
            res.render('guest.ejs', {
                title: 'Scheduler',
                schedule: results
            });
        });

    connection.end();
});

app.get('/user', function(req, res) {
    const connection = mysql.createConnection({
        host: 'jlg7sfncbhyvga14.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
        user: 'qgqifg7oz9sxl8ey',
        password: 's46bb5bu1c8y26hk',
        database: 'yrracjeliqow5h4f'
    });

    connection.connect();

    // TO DISPLAY USER'S CURRENT SCHEDULE
    if (req.session && req.session.username && req.session.username.length) {
        connection.query(
            `SELECT schedule.date, schedule.start_time, schedule.duration, users.username 
        FROM schedule 
        INNER JOIN users
        ON schedule.by=users.username
        WHERE schedule.username = '${req.session.username}'`, function (error, results, fields) {
                if (error) throw error;

                connection.query(
                    `SELECT date, start_time, FROM schedule
            ORDER BY date`, function (error, results2, fields) {
                        if (error) throw error;
                        connection.end();

                        res.render('user.hbs', {
                            date: results,
                            start_time: results2
                        });
                    });
            });
    } else {
        delete req.session.username;
        res.redirect('/');
    }
});

app.post('/user', function(req, res) {
    const connection = mysql.createConnection({
        host: 'jlg7sfncbhyvga14.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
        user: 'qgqifg7oz9sxl8ey',
        password: 's46bb5bu1c8y26hk',
        database: 'yrracjeliqow5h4f'
    });
    connection.connect();

    // IS USER WANTS TO DELETE A CLASS
    if(req.body.deleteClass) {
        connection.query(
            `DELETE FROM schedule
        WHERE username = '${req.session.username}' and name = '${req.body.deleteClass}'`, function(error, results) {
                // IF NO ROWS WERE AFFECTED, CLASS DOES NOT EXIST TO USERNAME
                if(results.affectedRows == 0){
                    connection.end();

                    res.json({
                        successful: false,
                        message: "Date not found."
                    });
                } else {
                    // CLASS EXISTS AND WAS DELETED
                    connection.end();

                    res.json({
                        successful: true
                    });
                }
            });
    } else {
        // WE ARE ADDING A NEW CLASS TO THE SCHEDULE
        connection.query(
            `INSERT INTO schedule
        (username, start_time, date, duration)
        VALUES ('${req.session.username}', '${req.body.start_time}', 
        '${req.body.date}', '${req.body.duration}')`, function(error, results) {
                if (error) throw error;
                connection.end();

                res.json({
                    successful: true
                });
            });
    }
});

app.get('/new', function(req, res) {
    res.render("new.html");
});

app.post('/new', function(req, res, next) {
    const connection = mysql.createConnection({
        host: 'jlg7sfncbhyvga14.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
        user: 'qgqifg7oz9sxl8ey',
        password: 's46bb5bu1c8y26hk',
        database: 'yrracjeliqow5h4f'
    });

    connection.connect();

    // CHECKING IF USERNAME OR EMAIL ALREADY EXISTS
    connection.query(
        `SELECT username, email FROM users
        WHERE username = '${req.body.username}' or email = '${req.body.email}' `,
        function (error, results, fields) {
            if (error) throw error;

            // IF THERE ARE NO RESULTS, USERNAME/EMAIL AREN'T IN THE DATABASE
            // CREATE A NEW USER
            if(!results.length) {
                connection.query(
                    `INSERT INTO users
                    (username, email, password, fullname)
                    VALUES ('${req.body.username}', '${req.body.email}', 
                    '${req.body.password}', '${req.body.fullName}')`,
                    function (error, results, fields) {
                        if (error) throw error;

                        connection.end();
                        req.session.username = req.body.username;
                        res.json({
                            successful: true,
                            message: ''
                        });
                    }
                );
            } else {
                // USERNAME OR PASSWORD ALREADY EXISTS IN DATABASE
                connection.end();
                res.json({
                    successful: false,
                    message: 'Invalid: username, or email already in use'
                });
            }
        }
    );
});

app.listen("5698", "0.0.0.0", function() {
    console.log("Express Server is Running...");
});

// server listener - heroku ready
app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Running Express Server...");
});