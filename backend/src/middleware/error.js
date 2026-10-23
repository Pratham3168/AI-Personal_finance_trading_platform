exports.notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });

exports.errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : err.message,
  });
};
