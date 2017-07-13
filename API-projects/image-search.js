let https = require("https");
let pg = require('pg');
let fs = require('fs');


//both getSearchResults and getHistory return Promises, as they are the start of their respective chains
let getSearchResults = (searchTerm, options) => {
  console.log("searching for", searchTerm, "with offset", options.offset);
  /*
    https://www.googleapis.com/customsearch/v1?q={SEARCHTERM}&key={DEVELOPER_KEY}&cx={CUSTOM_SEARCH_ENGINE_ID}&start={OFFSET}
    Note: the CX were using is already configured to ONLY return ImageObjects.
  */
  const QUERY = {
    base: "https://www.googleapis.com/customsearch/v1",
    key: process.env.CSE_KEY,
    cx: process.env.CX_ID,
    q: searchTerm,
    start: options.offset || 1,
    build: function () {
      return this.base +"?q="+ this.q +"&key="+ this.key +"&cx="+ this.cx +"&start=" + this.start;
    },
  };

  console.log("QUERY build:", QUERY.build()); //remove after debug
  return new Promise(function (resolve, reject) {
    https.get(QUERY.build(), (res) => {

      let buffer = ""; 
      res.on('data', (d) => {buffer += d;});
      res.on('end', () => {console.log("Successful Google Search"); resolve(JSON.parse(buffer));});

    }).on('error', (e) => {console.error("Failed Google Search"); reject(e);});
  });
};

//both getSearchResults and getHistory return Promises, as they are the start of their respective chains
let getHistory = () => {
  console.log("retrieving history"); //remove after debug
  return new Promise((resolve, reject) => {
    pg.connect(process.env.DATABASE_URL, (err, client, done) => {
      if (err) {throw err;}
      
      qString = "SELECT * from image_search ORDER BY created_at DESC LIMIT 10;"
      console.log(qString); //remove after debug
      client.query(qString, (err, results) => {
        done();
        if (err) {
          reject(err);
        } else {
          resolve(results.rows);
        }
      });
    });
  });
};

let formatSearchResults = (searchResults) => {
  console.log("formatting search results"); //remove after debug
  let formatted = searchResults.items.map((item, i) => {
    
    let url = "", thumbnail = "";
    if (item.pagemap.imageobject) { url = url = item.pagemap.imageobject[0].url;}
    if (item.pagemap.cse_thumbnail) {
      thumbnail = item.pagemap.cse_thumbnail[0].src
    } else {thumbnail = url;}

    let snippet = item.snippet || "";
    let context = item.link || "";
    
    return {url, thumbnail, snippet, context};
  });
  return formatted;
};

let formatHistory = (historyResults) => {
  console.log("formatting history"); //remove after debug
  return historyResults.map((result) => {
    let entry = {};
    entry[result.created_at] = result.search_term;
    return entry;
  });
};

let writeSearch = (searchTerm) => {
  console.log("writing search,", searchTerm+",", "to history"); //remove after debug

  pg.connect(process.env.DATABASE_URL, (err, client, done) => {
    if (err) {throw err;}
    
    let qString = "INSERT INTO image_search (search_term) VALUES ('"+searchTerm+"') RETURNING (search_term, created_at);"
    console.log(qString);
    client.query(qString, (err, results) => {
      done();
      console.log("created new row", results.rows);
    });
  });
};

module.exports = function (req, res, next) {
 
  // HELPER FUNCTIONS
  let returnOK = (body, status, contentType, moreHeaders) => {
    console.log("returning OK");
    res.status(status || 200);
    res.set({"Content-Type": contentType || "application/json"});
    if (moreHeaders !== undefined) {res.set(moreHeaders);}
    if (res.get('Content-Type') === "application/json" && typeof body === "object") {body = JSON.stringify(body);}
    res.end(body);
  };

  let returnERR = (message, status) => {
    console.error(message);
    res.status(status || 400);
    res.set({"Content-Type": "text/plain"});
    if (typeof message === "object") {message = JSON.stringify(message);}
    res.end(message);
  };

  //MAIN LOGIC && ROUTING
  let path = req.url.split(/\/|\?/);
  console.log("path:", path); //remove after debug
  let option = path[1];
  console.log("option:", option);

  //if blank
    //show index page
  if (option === "") {
    fs.readFile("./API-projects/image-search.html", (err, file) => {
      if (err) {returnERR(err, 500);}
      returnOK(file, 200, "text/html");
    });

  //else if for SEARCH
  } else if (option === "search") {
    //read search term and offset
    let searchTerm = path[2];
    console.log("searchTerm:", searchTerm); //remove after debug
    let offset = req.params.offset;
    console.log("offset:", offset); //remove after debug

    //write search term and search time to DB
    writeSearch(searchTerm)

    //do google search, plugging in searchterm and start index
    //format results from google search
    //return results
    getSearchResults(searchTerm, {offset})
      .then(formatSearchResults)
      .then(returnOK)
      .catch(returnERR)

  //else if for HISTORY
  } else if (option === "history") {

    //read DB and get lastest lastest 10 search strings with date
    //format results
    //return results
    getHistory()
      .then(formatHistory)
      .then(returnOK)
      .catch(returnERR)

  //else return error 
  } else {
    returnERR("Invalid URL");
  }
};






