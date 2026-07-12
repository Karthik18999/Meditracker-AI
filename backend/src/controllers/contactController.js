const Contact = require('../models/Contact');

/**
 * @desc    Get all emergency contacts
 * @route   GET /api/contacts
 * @access  Private
 */
const getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find({ userId: req.user.id });
    res.status(200).json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create emergency contact
 * @route   POST /api/contacts
 * @access  Private
 */
const createContact = async (req, res, next) => {
  const { name, relation, phone, email, isPrimary } = req.body;

  try {
    // If setting as primary, demote existing primary contacts
    if (isPrimary) {
      await Contact.updateMany({ userId: req.user.id }, { isPrimary: false });
    }

    const contact = await Contact.create({
      name,
      relation,
      phone,
      email,
      isPrimary: isPrimary || false,
      userId: req.user.id,
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update emergency contact
 * @route   PUT /api/contacts/:id
 * @access  Private
 */
const updateContact = async (req, res, next) => {
  const { isPrimary } = req.body;

  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    if (contact.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // If setting as primary, demote existing primary contacts
    if (isPrimary) {
      await Contact.updateMany({ userId: req.user.id }, { isPrimary: false });
    }

    contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete contact
 * @route   DELETE /api/contacts/:id
 * @access  Private
 */
const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    if (contact.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await contact.deleteOne();
    res.status(200).json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
};
