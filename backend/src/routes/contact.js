const express = require('express');
const { getContacts, createContact, updateContact, deleteContact } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getContacts)
  .post(createContact);

router.route('/:id')
  .put(updateContact)
  .delete(deleteContact);

module.exports = router;
