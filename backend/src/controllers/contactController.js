const Contact = require('../models/Contact');

/**
 * @desc    Get all emergency contacts
 * @route   GET /api/contacts
 * @access  Private
 */
const getContacts = async (req, res, next) => {
  try {
    const userId = req.targetUserId || req.user.id;
    const contacts = await Contact.find({ userId });
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
    const userId = req.targetUserId || req.user.id;

    // If setting as primary, demote existing primary contacts
    if (isPrimary) {
      await Contact.updateMany({ userId }, { isPrimary: false });
    }

    const contact = await Contact.create({
      name,
      relation,
      phone,
      email,
      isPrimary: isPrimary || false,
      userId,
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

    const userId = req.targetUserId || req.user.id;

    if (contact.userId.toString() !== userId.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // If setting as primary, demote existing primary contacts
    if (isPrimary) {
      await Contact.updateMany({ userId }, { isPrimary: false });
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

    const userId = req.targetUserId || req.user.id;

    if (contact.userId.toString() !== userId.toString()) {
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
