
const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('./models/Category');
const Supplier = require('./models/Supplier');
const Phone = require('./models/Phone');
const Accessory = require('./models/Accessory');

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGOURL);
        console.log('✅ Connected to MongoDB');

        // Clear old data
        await Promise.all([
            Category.deleteMany({}),
            Supplier.deleteMany({}),
            Phone.deleteMany({}),
            Accessory.deleteMany({})
        ]);

        console.log('🧹 Old data cleared');

        // --- Categories ---
        const phoneCat = await Category.create({ name: 'Phone' });
        const accessoryCat = await Category.create({ name: 'Accessory' });

        const subCategories = await Category.insertMany([
            { name: 'iPhone', parent: phoneCat._id },
            { name: 'Oppo', parent: phoneCat._id },
            { name: 'Vivo', parent: phoneCat._id },
            { name: 'Headphones', parent: accessoryCat._id },
            { name: 'Chargers', parent: accessoryCat._id },
            { name: 'Cases', parent: accessoryCat._id },
        ]);

        console.log('✅ Categories added');

        // --- Suppliers ---
        const suppliers = await Supplier.insertMany([
            { name: 'Tech Supplies Ltd', phone: '123456789', email: 'info@techsupplies.com', address: '123 Market Street' },
            { name: 'GadgetHub', phone: '987654321', email: 'support@gadgethub.com', address: '45 Silicon Ave' },
        ]);

        console.log('✅ Suppliers added');

        // --- Phones ---
        const phones = await Phone.insertMany([
            {
                brand: 'Apple',
                model: 'iPhone 15 Pro',
                slug: 'iphone-15-pro',
                pricing: { purchasePrice: 950, sellingPrice: 1199 },
                currency: 'USD',
                stock: 15,
                images: ['https://example.com/iphone15pro.jpg'],
                category: subCategories.find(c => c.name === 'iPhone')._id,
                supplier: suppliers[0]._id,
                specs: {
                    chipset: 'A17 Pro',
                    ram: 8,
                    storage: 256,
                    display: { sizeIn: 6.1, resolution: '2556x1179', type: 'OLED', refreshRate: 120 },
                    cameras: { main: '48MP', front: '12MP' },
                    batteryMah: 3274,
                    chargingW: 27,
                    os: 'iOS 17',
                    colors: ['Black Titanium', 'White Titanium']
                }
            },
            {
                brand: 'Oppo',
                model: 'Find X7',
                slug: 'oppo-find-x7',
                pricing: { purchasePrice: 550, sellingPrice: 699 },
                currency: 'USD',
                stock: 25,
                images: ['https://example.com/oppo-findx7.jpg'],
                category: subCategories.find(c => c.name === 'Oppo')._id,
                supplier: suppliers[1]._id,
                specs: {
                    chipset: 'Snapdragon 8 Gen 3',
                    ram: 12,
                    storage: 256,
                    display: { sizeIn: 6.7, resolution: '3200x1440', type: 'AMOLED', refreshRate: 120 },
                    cameras: { main: '50MP', front: '32MP' },
                    batteryMah: 5000,
                    chargingW: 100,
                    os: 'Android 14',
                    colors: ['Black', 'Blue']
                }
            },
            {
                brand: 'Vivo',
                model: 'V30 Pro',
                slug: 'vivo-v30-pro',
                pricing: { purchasePrice: 480, sellingPrice: 599 },
                currency: 'USD',
                stock: 18,
                images: ['https://example.com/vivo-v30pro.jpg'],
                category: subCategories.find(c => c.name === 'Vivo')._id,
                supplier: suppliers[1]._id,
                specs: {
                    chipset: 'Dimensity 8200',
                    ram: 8,
                    storage: 256,
                    display: { sizeIn: 6.67, resolution: '2400x1080', type: 'AMOLED', refreshRate: 120 },
                    cameras: { main: '64MP', front: '32MP' },
                    batteryMah: 4600,
                    chargingW: 80,
                    os: 'Android 14',
                    colors: ['Midnight Black', 'Aurora Blue']
                }
            }
        ]);

        console.log('✅ Phones added');

        // --- Accessories ---
        const accessories = await Accessory.insertMany([
            {
                name: 'iPhone 15 Pro Case',
                type: 'Case',
                brand: 'Apple',
                pricing: { purchasePrice: 15, sellingPrice: 35 },
                stock: 50,
                images: ['https://example.com/iphone15procase.jpg'],
                category: subCategories.find(c => c.name === 'Cases')._id,
                supplier: suppliers[0]._id,
                compatibility: ['iphone-15-pro'],
                attributes: { material: 'Silicone', color: 'Black' }
            },
            {
                name: 'Oppo Find X7 Charger',
                type: 'Charger',
                brand: 'Oppo',
                pricing: { purchasePrice: 10, sellingPrice: 25 },
                stock: 60,
                images: ['https://example.com/oppocharger.jpg'],
                category: subCategories.find(c => c.name === 'Chargers')._id,
                supplier: suppliers[1]._id,
                compatibility: ['oppo-find-x7'],
                attributes: { power: '100W', connector: 'USB-C' }
            },
            {
                name: 'Vivo Headphones',
                type: 'Headphones',
                brand: 'Vivo',
                pricing: { purchasePrice: 20, sellingPrice: 49 },
                stock: 35,
                images: ['https://example.com/vivoheadphones.jpg'],
                category: subCategories.find(c => c.name === 'Headphones')._id,
                supplier: suppliers[1]._id,
                compatibility: ['vivo-v30-pro'],
                attributes: { type: 'Wireless', battery: '30h' }
            }
        ]);

        console.log('✅ Accessories added');

        console.log('\n🎉 Database seeding completed successfully!');
        console.log(`📱 Phones: ${phones.length}, 🎧 Accessories: ${accessories.length}`);
        process.exit();
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedDatabase();
