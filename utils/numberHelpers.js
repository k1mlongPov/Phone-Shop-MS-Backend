const Counter = require('../models/Counter');

async function generateInvoiceNo() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const key = `invoice:${yyyy}${mm}${dd}`;
    const counter = await Counter.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    const seqString = String(counter.seq).padStart(4, '0');
    return `INV-${yyyy}${mm}${dd}-${seqString}`;
}

async function generatePoNo() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const key = `po:${yyyy}${mm}${dd}`;
    const counter = await Counter.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    const seqString = String(counter.seq).padStart(4, '0');
    return `PO-${yyyy}${mm}${dd}-${seqString}`;
}

module.exports = { generateInvoiceNo, generatePoNo };