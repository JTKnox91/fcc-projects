let pg = require('pg');
pg.defaults.ssl = true;
let fs = require('fs');

//   pg.connect(process.env.DATABASE_URL, function(err, client, done) {
//     client.query('SELECT * FROM test_table', function(err, result) {
//       done();
//       if (err)
//        { console.error(err); response.send("Error " + err); }
//       else
//        { response.render('pages/db', {results: result.rows} ); }
//     });
//   });


/*
A Note about how the short URLs work:
  This is a small scale version of the way Youtube makes URLs for its videos.
  Rather than using a sequential number, a random sequence of characters is generated.
  You could also model this as generating a random number and converting it to characters.
  In the event of a random url matching an existing one, a new random one is created, but
  if the range is sufficiently large, that does not happen often.
*/

let randomString = (length) => {
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  let randomChar = () => {return possible[Math.floor(Math.random() * 52)];};

  let result = "";
  for (var i = 0; i < length; i++) {
    result += randomChar();
  }

  return result;
};

let readShortcut = (shortcut, callback) => {
  console.log("Reading Shortcut", shortcut);
  pg.connect(process.env.DATABASE_URL, (err, client, done) => {
    if (err) {throw err;}

    let qString = "SELECT * FROM short_url WHERE short = '"+ shortcut +"';";
    console.log(qString);
    client.query(qString, (err, results) => {
      done();
      console.log("results from shortcut "+shortcut+":")
      console.log(results.rows);
      callback(err, results.rows);
    });  
  
  });
};

let writeShortcut = (original, callback) => {
  let newShort = randomString(4);
  console.log("Attempting to write original", original, "as", newShort); 

  //confirm URL is unique
  readShortcut(newShort, (err, results) => {
    if (err) {callback(err);}
    
    //if url is Unique (most likely), write it to DB
    if (results.length === 0) {
      pg.connect(process.env.DATABASE_URL, (err, client, done) => {
        if (err) {throw err;}
        
        let qString = "INSERT INTO short_url (original, short) VALUES ('"+original+"', '"+newShort+"') RETURNING short;"
        console.log(qString);
        client.query(qString, (err, results) => {
          done();
          console.log("results from original "+original+" and short "+newShort+":");
          console.log(results.rows);
          callback(err, results.rows);
        });
      });

    //if name url is NOT unique, make a new one
    } else {
      console.log("INCREDIBLY RARE!\n" + newShort + " is NOT unique");
      writeShortcut(original, callback);
    }
  })
};


module.exports = function (req, res, next) {

  const base = "https://jtknox91-fcc.herokuapp.com/url-short";
  let option = req.url[1];

  //if nothing after / send html
  if (option === undefined) {
    fs.readFile("./API-projects/url-short.html", (err, data) => {
      if (err) {
        res.status(500);
        res.set({'Content-Type': 'text/plain'});
        res.end(JSON.stringify(err));

        throw err;
      }

      res.status(200);
      res.set({'Content-Type': 'text/html'});
      res.end(data);
    });

  //else if  /s
  } else if (option === "s") {
    let short = req.url.slice(3);

    //check if shortcut exists
      //return redirect, or 404
    readShortcut(short, (err, results) => {
      if (err) {
        res.status(500);
        res.set({'Content-Type': 'text/plain'});
        res.end(JSON.stringify(err));
        throw err;        
      }

      if (results.length === 0) {
        res.status(404);
        res.set({'Content-Type': 'text/plain'});
        res.end(base+"/s/"+short + " is not mapped to a url.");
      } else {
        res.status(302);
        res.set({'Location': results[0].original});
        res.end();  
      }
      
    });

  //else if /n
  } else if (option === "n") {
    let original = req.url.slice(3);

    //check if valid url
    let validURL = /^https?\:\/\/(?:[A-Za-z0-9\-]+\.){1,2}[A-Za-z0-9\-]+(?:\/.*|$)/;
    if (validURL.test(original)) {
      //make new shortcut
      writeShortcut(original, (err, results) => {
        if (err) {        
          res.status(500);
          res.set({'Content-Type': 'text/plain'});
          res.end(JSON.stringify(err));
          throw err;
        }
        
        let result = {
          original_url: original,
          short_url: base+"/s/"+results[0].short,
        };

        res.status(201);
        res.end(JSON.stringify(result));
      });

    //else return error
    } else {
        res.status(400);
        res.set({'Content-Type': 'text/plain'});
        res.end('\"'+original+'\" is not a valid url.');
    }

  //else return error
  } else {

  }
};