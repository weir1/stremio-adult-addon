const errorHandler = (error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    ok: false,
    error: 'Internal server error',
    message: error.message
  });
};

const notFoundHandler = (req, res) => {
  console.log('❌ 404 for path:', req.path);
  res.status(404).json({
    ok: false,
    error: 'Not found',
    path: req.path
  });
};

module.exports = { errorHandler, notFoundHandler };
