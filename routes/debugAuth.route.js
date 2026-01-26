import express from 'express';

const router = express.Router();

// Check authentication status without middleware
router.get('/check-auth', (req, res) => {
  const token = req.cookies.access_token;
  res.json({
    hasToken: !!token,
    token: token ? 'Present' : 'Missing',
    cookies: req.cookies
  });
});

export default router;