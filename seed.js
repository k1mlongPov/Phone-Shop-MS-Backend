
require("dotenv").config();
const mongoose = require("mongoose");

const Supplier = require("./models/Supplier");
const Phone = require("./models/Phone");
const Accessory = require("./models/Accessory");

(async () => {
    try {
        await mongoose.connect(process.env.MONGOURL);
        console.log("Connected to MongoDB");

        const suppliers = await Supplier.find();
        let totalFixed = 0;

        for (const s of suppliers) {
            const cleaned = [];

            for (const sp of s.suppliedProducts || []) {

                if (!sp.productId) continue;

                let exists = null;

                if (sp.modelType === "Phone") {
                    exists = await Phone.findById(sp.productId);
                } else if (sp.modelType === "Accessory") {
                    exists = await Accessory.findById(sp.productId);
                }

                if (exists) {
                    cleaned.push(sp);
                } else {
                    console.log(
                        `❌ Removed invalid: supplier=${s.name}, productId=${sp.productId}, type=${sp.modelType}`
                    );
                    totalFixed++;
                }
            }

            // Only save if changes exist
            if (cleaned.length !== (s.suppliedProducts || []).length) {
                s.suppliedProducts = cleaned;
                await s.save();
                console.log(`✔ Updated supplier: ${s.name}`);
            }
        }

        console.log("=====================================");
        console.log(`Cleanup complete. Removed ${totalFixed} invalid entries.`);
        console.log("=====================================");

        mongoose.connection.close();
    } catch (err) {
        console.error("Cleanup failed:", err);
        mongoose.connection.close();
    }
})();
