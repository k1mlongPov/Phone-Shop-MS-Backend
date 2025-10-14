require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Phone = require('./models/Phone');
const Accessory = require('./models/Accessory');
const Category = require('./models/Category');

(async () => {
    await connectDB(process.env.MONGOURL);

    await Phone.deleteMany({});
    await Accessory.deleteMany({});
    await Category.deleteMany({}); // ✅ clear old categories

    const mainCategories = await Category.insertMany([
        { name: 'Phones', description: 'All smartphones and brands' },
        { name: 'Accessories', description: 'Chargers, cases, cables, etc.' },
    ]);

    const phonesCategory = await Category.findOneAndUpdate(
        { name: 'Phones' },
        { description: 'All mobile phones' },
        { new: true, upsert: true }
    );

    const accessoryCategory = await Category.findOneAndUpdate(
        { name: 'Accessories' },
        { description: 'Chargers, cases, cables, etc.' },
        { new: true, upsert: true }
    );

    await Category.insertMany([
        { name: 'iPhone', parent: phonesCategory },
        { name: 'Samsung', parent: phonesCategory },
        { name: 'Vivo', parent: phonesCategory },
        { name: 'Oppo', parent: phonesCategory },
        { name: 'Cases', parent: accessoryCategory },
        { name: 'Chargers', parent: accessoryCategory },
    ]);


    const phones = [
        {
            brand: 'ExampleBrand',
            model: 'X1 Pro',
            slug: 'examplebrand-x1-pro',
            pricing: {
                purchasePrice: 500,
                sellingPrice: 699
            },
            currency: 'USD',
            specs: {
                chipset: 'SnapDragon 9000',
                ram: 8,
                storage: 128,
                display: { sizeIn: 6.5, resolution: '2400x1080', type: 'AMOLED', refreshRate: 120 },
                cameras: { main: '108MP', front: '32MP' },
                batteryMah: 4500,
                chargingW: 65,
                os: 'Android 14',
                colors: ['Black', 'Blue']
            },
            category: phonesCategory,
            images: ['https://example.com/x1-front.jpg'],
            stock: 10,
            sku: 'EB-X1PRO-128'
        },
        {
            brand: 'ExampleBrand',
            model: 'X1 Lite',
            slug: 'examplebrand-x1-lite',
            pricing: {
                purchasePrice: 300,
                sellingPrice: 399
            },
            currency: 'USD',
            specs: { ram: 6, storage: 64, batteryMah: 4000, os: 'Android 14', colors: ['White'] },
            stock: 25,
            category: phonesCategory
        }
    ];



    const accessories = [
        {
            name: 'X1 Pro Clear Case',
            type: 'case',
            brand: 'CaseMaker',
            pricing: {
                purchasePrice: 10,
                sellingPrice: 19.99
            },
            compatibility: ['examplebrand-x1-pro'],
            stock: 100,
            category: accessoryCategory
        },
        {
            name: 'Fast Charger 65W',
            type: 'charger',
            brand: 'ChargeCo',
            pricing: {
                purchasePrice: 18,
                sellingPrice: 29.99
            },
            stock: 50,
            category: accessoryCategory,
            attributes: { wattage: 65, cableIncluded: true }
        }
    ];


    await Phone.insertMany(phones);
    await Accessory.insertMany(accessories);
    console.log('✅ Seeded hierarchical categories successfully');

    (async () => {
        try {
            await connectDB(process.env.MONGOURL);
            //await Promise.all([Phone.deleteMany({}), Accessory.deleteMany({}), Category.deleteMany({})]);
            // ... insert data here ...
            console.log('✅ Seeded DB successfully');
            process.exit();
        } catch (error) {
            console.error('❌ Seeding failed:', error);
            process.exit(1);
        }
    })();
})();
