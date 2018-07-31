const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

require("./app/routes")(app, {});

const port = 8000;

app.listen(port, () => {
  console.log("Auth server listening on port: " + port);
});
