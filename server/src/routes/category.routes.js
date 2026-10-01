const express = require('express');
const categoryController = require('../controllers/category.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { createCategorySchema, updateCategorySchema } = require('../validators/category.validator');

const router = express.Router();

// Every route here is protected.
router.use(authenticate);

router.get('/', categoryController.list);
router.post('/', validate(createCategorySchema), categoryController.create);
router.patch('/:id', validate(updateCategorySchema), categoryController.update);
router.delete('/:id', categoryController.remove);

module.exports = router;