const { body, validationResult } = require('express-validator');

const validateStudent = [
  body('first_name')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name must be 50 characters or less'),
  body('last_name')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name must be 50 characters or less'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  body('phone')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 15 }).withMessage('Phone must be 15 characters or less'),
  body('date_of_birth')
    .optional({ values: 'null' })
    .isISO8601().withMessage('Must be a valid date'),
  body('gender')
    .optional({ values: 'null' })
    .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  body('course')
    .trim()
    .notEmpty().withMessage('Course is required')
    .isLength({ max: 100 }).withMessage('Course must be 100 characters or less'),
  body('enrollment_year')
    .notEmpty().withMessage('Enrollment year is required')
    .isInt({ min: 2000, max: 2030 }).withMessage('Enrollment year must be a valid 4-digit year'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'graduated']).withMessage('Status must be active, inactive, or graduated'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: null,
        message: errors.array().map((e) => e.msg).join(', '),
      });
    }
    next();
  },
];

module.exports = validateStudent;
