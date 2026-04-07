const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
require('dotenv').config();

const authRoutes    = require('./routes/auth');
const projectRoutes = require('./routes/projects');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',     authRoutes);
app.use('/api/projects', projectRoutes);

// Connect DB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch(err => console.log(err));