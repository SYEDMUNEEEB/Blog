const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(cookieParser());

const saltRounds = 10;
const secret = '079cf1a61e2528858cbf4b0aa15a9620bf691ea6498dd377d155814db22a2f57';
mongoose.connect('mongodb+srv://muneebsyed70:ZGdBDALe4Rf0WKbd@cluster0.lr9ueud.mongodb.net/');
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Registration endpoint
app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      email,
    });

    const token = jwt.sign({ userId: newUser._id }, secret, { expiresIn: '50h' });
    res.cookie('token', token, { httpOnly: true });
    res.json(newUser);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login endpoint
app.post('/login', async (req,res) => {
  const {username,password} = req.body;
  const userDoc = await User.findOne({username});
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // logged in
    jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) => {
      if (err) throw err;
      res.cookie('token', token).json({
        id:userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json('wrong credentials');
  }
});
// Profile endpoint
app.get('/profile', (req,res) => {
  const {token} = req.cookies;
console.log(token)
  // jwt.verify(token, secret, {}, (err,info) => {
  //   if (err) throw err;
  //   res.json(info);
  // });
});


// Logout endpoint
app.post('/logout', (req, res) => {
  res.clearCookie('token').json('Logged out successfully');
});

app.listen(port, () => {
  console.log(`Your app is running on ${port}`);
});
