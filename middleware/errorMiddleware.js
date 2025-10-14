const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(status).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
};

module.exports = { errorHandler };
