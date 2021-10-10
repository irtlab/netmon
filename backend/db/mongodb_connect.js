/**
 * db/mongodb_connect.js
 *
 * Authors:
 *   Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.
 *
 * Description:
 * File provides MongoDB Client connection for express application.
 *
 */

const tls = require('tls');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const constants = require('../common/constants');


function ConnectToMongoDB(url, callback, hostname) {
  const options = {
    useUnifiedTopology: true,
    sslValidate: true,
    checkServerIdentity: (name, cert) => tls.checkServerIdentity(hostname || name, cert),
    poolSize: 64,
    useNewUrlParser: true
  };

  MongoClient.connect(url, options, (error, client) => {
    assert.equal(null, error);

    const mongo_db = client.db(constants.db_name);
    if (mongo_db) callback(null, mongo_db, client);
    else callback('Error: MonogDB database connection failed.', null, null);
  });
}

module.exports = ConnectToMongoDB;

