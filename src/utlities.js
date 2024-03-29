const fs = require('fs');
const mimetypes = require('./mimetypes.json');
const path = require('path');
const { resolve } = require('path');
const mysql = require('mysql');
const dbcon = require('./config/db.json');
const { rejects } = require('assert');
const { time } = require('console');

exports.sendText = (res, msg, status = 200) => {
	res.statusCode = status;
	res.setHeader('Content-type', 'text/plain');
	res.end(msg);
};

exports.sendJson = (res, msg, status = 200) => {
	res.statusCode = status;
	res.setHeader('Content-type', 'application/json');
	res.end(JSON.stringify(msg));
};

exports.sendFile = (res, filename) => {
	const ext = path.extname(filename);
	const mime = mimetypes[ext];
	fs.readFile(filename, (err, filecontent) => {
		if (err) {
			exports.sendJson(res, { msg: 'Filen findes ikke' }, 404);
			return;
		}
		res.statusCode = 200;
		res.setHeader('Content-type', mime.type);
		res.end(filecontent);
	});
};

exports.logger = (req, res) => {
	let hrtime = process.hrtime();
	let logStr = new Date().toISOString();
	logStr += ` ${req.method} ${req.url}`;
	res.on('finish', () => {
		let endtime = process.hrtime(hrtime);
		logStr += ` ${res.statusCode} ${res.statusMessage} ${(endtime[0] * 1000 + endtime[1]) / 1000000}ms\n`;
		fs.appendFile("public/log/log.txt", logStr, function(err){
			if(err) {
				console.log(err);
			};
			console.log('File saved!')
			});;
		console.log(logStr);
	});
};

exports.redirect = (res, url) => {
	res.statusCode = 308;
	res.setHeader('Location', url);
	res.end();
};

exports.getBody = (req) => {
	let body = '';
	return new Promise((resolve, reject) => {
		req.on('data', (chunk) => {
			body += chunk;
		});
		req.on('end', () => {
			try {
				body = JSON.parse(body);
			}
			catch (err) {
				console.log(err);
			}
			resolve(body);
		});
		req.on('error', () => {
			reject('Fejl');
		});
	});
};

exports.getUserById = (id) => {
	return new Promise((resolve, rejects) => {
		var con = mysql.createConnection(dbcon);
		const sql = `SELECT * FROM user WHERE id = ${id};`;

		con.query(sql, function (err, rows) {
			if (err) {
				return rejects(err);
			}
			resolve(rows);
		});
	});
};

exports.getUsers = () => {
	return new Promise((resolve, rejects) => {
		var con = mysql.createConnection(dbcon);
		const sql = `SELECT * FROM user;`;

		con.query(sql, function (err, rows) {
			if (err) {
				return rejects(err);
			}
			resolve(rows);
		});
	});
};

exports.postUser = (req) => {
	return this.getBody(req).then((body) => {
		return new Promise((resolve, rejects) => {
			var con = mysql.createConnection(dbcon);
			const sql = `INSERT INTO user (name, email, student, title, lastupdated)
                    VALUES
                    (
                    "${body.name}",
                    "${body.email}",
                    ${body.student},
                    "${body.title}",
					CURRENT_TIMESTAMP
                    );`;
			con.query(sql, (err, rows) => {
				if (err) {
					return rejects(err);
				}
				resolve(rows);
			});
		});
	});
};

exports.updateUser = (req, id) => {
	return this.getBody(req).then((body) => {
		return new Promise((resolve, rejects) => {
			var con = mysql.createConnection(dbcon);
			const sql = `UPDATE user
						SET 
                        name = "${body.name}",
                        email = "${body.email}",
                        student = ${body.student},
                        title = "${body.title}",
						lastupdated = CURRENT_TIMESTAMP
                        WHERE id = ${id}
                        ;`;
			con.query(sql, (err, rows) => {
				if (err) {
					return rejects(err);
				}
				resolve(rows);
			});
		});
	});
};

exports.deleteUser = (id) => {
	return new Promise((resolve, rejects) => {
		var con = mysql.createConnection(dbcon);
		const sql = `DELETE FROM user WHERE id = ${id};`;
		con.query(sql, function (err, rows) {
			if (err) {
				return rejects(err);
			}
			resolve(rows);
		});
	});
};
