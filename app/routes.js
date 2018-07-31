const request = require("request");
const cors = require("cors");

const config = {
  CLIENT_ID: "nbH4LKwhGrN4M8OPloE8yndqHK0x9y5hhjz6HjlT",
  CLIENT_SECRET:
    "emvozCHanvJMX27TTOurZMxjokPGdYKVEI1NgaCRKFYF6XD18JSau8puT0mWdxsDMTD719sZotHhrOt2cmKgJs1lm1kA14Dsr7BeL2FksLTNN4lL50MsQ0i752gzNDfy",
  REDIRECT_URI: "http://localhost:8000/auth",
  ALLOWED_ORIGINS: ["http://localhost:8081"],
  OAUTH_URL: "http://yidp-geonode.geoweb.io/o/auth/"
};

const handler = function(event, context, callback) {
  // Retrieve the request, more details about the event variable later
  const headers = event.headers;
  const body = event.body;
  const origin = headers.origin || headers.Origin;

  // Check for malicious request
  if (!config.ALLOWED_ORIGINS.includes(origin)) {
    throw new Error(`${headers.origin} is not an allowed origin.`);
  }

  const url = config.OAUTH_URL;
  const options = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      // code: body.code,
      code: "authorization_code",
      client_id: config.CLIENT_ID,
      client_secret: config.CLIENT_SECRET,
      redirect_uri: config.REDIRECT_URI
    })
  };

  request(url, options, function(err, response) {
    if (err) {
      callback({ success: false, error: err });
      return;
    }

    callback(null, {
      success: true,
      // Access token should be stored in response.body
      body: response.body
    });
  });
};

const resourceOwner = function doResourceOwnerFlow(cred, res) {
  const auth = require("simple-oauth2").create({
    // use config above
    client: {
      id: config.CLIENT_ID,
      secret: config.CLIENT_SECRET
    },
    auth: {
      tokenHost: "http://yidp-geonode.geoweb.io",
      tokenPath: "/o/token/"
      // authorizePath: "/o/authorize/"
    }
  });
  const tokenConfig = {
    username: cred.username,
    password: cred.password,
    scope: "write" // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
  };
  try {
    auth.ownerPassword
      .getToken(tokenConfig)
      .then(resp => {
        console.log(resp);
        const accessToken = auth.accessToken.create(resp);
        return res.status(200).json({ success: true, data: accessToken });
      })
      .catch(err => {
        console.log(err.data.res);
        return res
          .status(err.data.res.statusCode)
          .json({ success: false, message: err.data.res.statusMessage });
      });
  } catch (err) {}
};

module.exports = (app, db) => {
  app.options("/auth", cors());
  app.post("/auth", cors(), (req, res) => {
    // add username, password validation here..
    resourceOwner(req.body, res);
  });
};
