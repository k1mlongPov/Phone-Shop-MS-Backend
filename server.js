require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const path = require('path');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

const categoryRoutes = require('./routes/category');
const phoneRoutes = require('./routes/phone');
const accessoryRoutes = require('./routes/accessory');
const supplierRoutes = require('./routes/supplier');
const customerRoutes = require('./routes/customer');
const stockMovementRoutes = require('./routes/stock');
const reportRoutes = require('./routes/report');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB(process.env.MONGOURL);

app.get('/', (req, res) => res.send('Phone Shop API is running'));

app.use('/api/categories', categoryRoutes);
app.use('/api/phones', phoneRoutes);
app.use('/api/accessories', accessoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port http/0.0.0.0:${PORT}`));
