function generateAccessorySku(name, type) {
    const clean = (str) =>
        (str || "")
            .toString()
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "");

    const n = clean(name).slice(0, 4);
    const t = clean(type).slice(0, 4);

    const rand = Math.floor(1000 + Math.random() * 9000);

    return `ACC-${n}-${t}-${rand}`;
}

module.exports = generateAccessorySku;
