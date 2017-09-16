'use strict';

const express     = require('express'),
      fileUpload  = require('express-fileupload'),
      bodyParser  = require('body-parser'),
      markdown    = require('markdown-it')(),
      MongoClient = require('mongodb').MongoClient,
      ObjectId    = require('mongodb').ObjectId,
      PORT        = 3000,
      DB_URL      = 'mongodb://localhost:27017/marksite',
      app         = express();

app.use(express.static(__dirname + '/public'));
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('GET root');
});

app.post('/create', (req, res) => {
  if (req.files.mdFile == undefined) {
    res.redirect('/');
    return;
  }
  MongoClient.connect(DB_URL, (err, db) => {
    if (err == null) {
      const col = db.collection('sites');
      col.insert({ content: req.files.mdFile.data.toString() }, (err, docs) => {
        if (err == null) {
          let createdID = docs.insertedIds[0];
          res.redirect(`/render/${createdID}`);
        } else
          console.log(`Creation error: ${err}`);
      });
    } else {
      console.log(`Connection error: ${err}`);
    }

    db.close();
  });
});

app.get('/render/:id', (req, res) => {
  const renderHTMLStart = `\
<!doctype html>
<html>
  <head>
    <title>marksite</title>
    <style>
      html, body {
        height: 100%;
        width: 100%;
        margin: 0;
      }
      body {
        color: #303030;
        background-color: #E0DDCF;
      }
      #md {
      }
    </style>
  </head>

  <body>
    <div id='md'>
`;

  const renderHTMLEnd = `
    </div>
  </body>
</html>
`;

  let id = new ObjectId(req.params.id); // TODO this sometimes throws an error but seems to always work
  MongoClient.connect(DB_URL, (err, db) => {
    if (err == null) {
      const col = db.collection('sites');
      col.findOne({ _id: id }, {}, (err, doc) => {
        if (err == null) {
          res.send(markdown.render(doc.content));
        } else {
          console.log(`Render error: ${err}`);
          res.send('Not found :^(');
        }
      });
    } else {
      console.log(`Connection error: ${err}`);
    }
    db.close();
  });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
