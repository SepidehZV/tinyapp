const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const morgan = require('morgan');

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.set("view engine", "ejs");

//database block
/*const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};*/
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};
const emailLookup = function(users,email) {
  for (let key in users) {
    if (users[key]['email'] === email) {
      return users[key];
    }
  }
  return "";
};

const urlsForUser = function(id) {
  let urls = {};
  for (let shortURL in urlDatabase) {
    if (id === urlDatabase[shortURL].userID) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
}

//**database block end */

app.get("/urls", (req, res) => {
  //let templateVars = {};
  const  userID  = req.cookies['user_id'];
  const loggedInUser = users[userID];
  let templateVars = {urls: urlsForUser(userID), user: loggedInUser };
  //templateVars.user = "";
  /*for (let user in users) {
    //console.log(user);
    if (user === userID) {
      templateVars.user = users[user];
      templateVars.urls = urlsForUser(user);
    }
  };*/
  
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {};
  const userID = req.cookies['user_id'];
  if (userID) {
    const loggedInUser = users[userID];
    templateVars = { user: loggedInUser };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/urls');
  }
  
});

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
};

app.post("/urls", (req, res) => {
  const uniqeShortUrl = generateRandomString();
  const longURL = req.body.longURL;
  const userID = req.cookies['user_id'];
  urlDatabase[uniqeShortUrl]= {longURL, userID };
  console.log(urlDatabase);
  res.redirect(`/urls/${uniqeShortUrl}`);        
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies['user_id'];
  const longURL = urlDatabase[req.params.shortURL].longURL;
  let templateVars = {shortURL: req.params.shortURL, longURL };
  if (userID) {
    if (urlDatabase[req.params.shortURL].userID === userID) {
      templateVars.user = users[userID];
      res.render("urls_show", templateVars);
    } else {
      res.status(403);
      res.send('403-Forbidden');
    }
    
  } else {
    res.redirect('/urls');
  }
  
});

app.get("/u/:shortURL", (req, res) => {
  const {longURL} = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.cookies['user_id'];
  if (urlDatabase[req.params.shortURL].userID === userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403);
    res.send('403-Forbidden');
  }
  
});
app.post('/urls/:shortURL/edit', (req, res) => {
  const longURL = req.body.editedLongURL;
  const userID = req.cookies['user_id'];
  if (urlDatabase[req.params.shortURL].userID === userID) {
    urlDatabase[req.params.shortURL]= {longURL, userID };
    res.redirect('/urls');
  } else {
    res.status(403);
    res.send('403-Forbidden');
  }
  
});
app.get('/login', (req, res) => {
  let templateVars = {};
  const userID = req.cookies['user_id'];
  templateVars.user = "";
  for (let user in users) {
    if (user === userID) {
      templateVars.user = users[user];
    }
  };
  res.render('urls_login', templateVars);
})
app.post('/login', (req, res) => {
  const {email, password} = req.body;
  const existedUser = emailLookup(users,email);
  if (email && password) {
    if (!existedUser) {
      res.status(403);
      res.send('403-Forbidden');
    }
    if (existedUser.email === email && existedUser.password === password) {
      res.cookie('user_id',existedUser.id);
      res.redirect('/urls');
    } else {
      res.status(403);
      res.send('403-Forbidden');
    }
  }
});
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});
app.get('/register', (req, res) => {
  //console.log(users);
  let templateVars = {};
  const userID = req.cookies['user_id'];
  templateVars.user = "";
  for (let user in users) {
    if (user === userID) {
      templateVars.user = users[user]
    }
  };
  res.render('urls_register',templateVars);
});

const createUser = (userObj, email, password) => {
  const randomId = generateRandomString();
  return userObj[randomId] = {
    id: randomId,
    email,
    password
  }
};


app.post('/register', (req, res) => {
  const {email, password} = req.body;
  if (email && password) {
    //console.log(emailLookup(users,email));
    if (emailLookup(users,email)) {
      res.status(400);
      res.send("400 - Bad request/user already exist!");
    } else {
      const newUser = createUser(users,email,password);
      const user_id = newUser.id;
      res.cookie('user_id',user_id);
      //console.log(users);
      res.redirect('/urls');
    }
    
  } else {
    res.status(400);
    res.send("400 - Bad request");
  }
  
});

app.get("/*", (req, res) => {
  res.status(404);
  res.send("404 - Not found");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});