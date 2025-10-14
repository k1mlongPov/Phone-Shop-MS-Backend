require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

const phoneRoutes = require('./routes/phone');
const accessoryRoutes = require('./routes/accessory');
const categoryRoutes = require('./routes/category');
const reportRoutes = require('./routes/report');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// connect to DB
connectDB(process.env.MONGOURL);

app.get('/', (req, res) => res.send('Phone Shop API is running'));

app.use('/api/phones', phoneRoutes);
app.use('/api/accessories', accessoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);

// error handling (last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
