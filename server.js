require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const path = require('path');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// route modules
const AuthRoute = require("./routes/auth");
const UserRoute = require('./routes/user');
const CategoryRoutes = require('./routes/category');
const PhoneRoutes = require('./routes/phone');
const AccessoryRoutes = require('./routes/accessory');
const SupplierRoutes = require('./routes/supplier');
const CustomerRoutes = require('./routes/customer');
const StockMovementRoutes = require('./routes/stock');
const InvoiceRoutes = require('./routes/invoice');
const PurchaseOrderRoutes = require('./routes/purchaseOrder');
const ReportRoutes = require('./routes/report');

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));


// connect to DB
connectDB(process.env.MONGOURL);

// basic health check
app.get('/', (req, res) => res.send('Phone Shop API is running'));

// MOUNT ROUTES on the app (use app.use, not router.use)
app.use('/api/auth', AuthRoute);
app.use('/api/users', UserRoute);
app.use('/api/categories', CategoryRoutes);
app.use('/api/phones', PhoneRoutes);
app.use('/api/accessories', AccessoryRoutes);
app.use('/api/suppliers', SupplierRoutes);
app.use('/api/customers', CustomerRoutes);
app.use('/api/stock', StockMovementRoutes);
app.use('/api/invoices', InvoiceRoutes);
app.use('/api/purchase-orders', PurchaseOrderRoutes);
app.use('/api/reports', ReportRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// error handler (should be after routes)
app.use(errorHandler);

app.use((err, req, res, next) => {
    const status = err.status || 500;
    console.error(err);
    res.status(status).json({ message: err.message || 'Internal Server Error' });
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
