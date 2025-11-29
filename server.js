require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const path = require('path');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

const AuthRoute = require("./routes/auth");
const UserRoute = require('./routes/user');
const CategoryRoutes = require('./routes/category');
const PhoneRoutes = require('./routes/phone');
const AccessoryRoutes = require('./routes/accessory');
const SupplierRoutes = require('./routes/supplier');
const CustomerRoutes = require('./routes/customer');
const StockMovementRoutes = require('./routes/stock');
const PurchaseOrderRoutes = require('./routes/purchaseOrder');
const ReportRoutes = require('./routes/report');
const DashboardRoutes = require("./routes/dashboard");
const SalesRoutes = require('./routes/sale');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

connectDB(process.env.MONGOURL);

app.get('/', (req, res) => res.send('Phone Shop API is running'));

app.use('/api/auth', AuthRoute);
app.use('/api/users', UserRoute);
app.use('/api/categories', CategoryRoutes);
app.use('/api/phones', PhoneRoutes);
app.use('/api/accessories', AccessoryRoutes);
app.use('/api/suppliers', SupplierRoutes);
app.use('/api/customers', CustomerRoutes);
app.use('/api/stock', StockMovementRoutes);
app.use('/api/purchase-orders', PurchaseOrderRoutes);
app.use('/api/reports', ReportRoutes);
app.use("/api/dashboard", DashboardRoutes);
app.use("/api/sales", SalesRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
