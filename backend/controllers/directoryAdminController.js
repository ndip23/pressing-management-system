// server/controllers/directoryAdminController.js
import asyncHandler from '../middleware/asyncHandler.js';
import DirectoryListing from '../models/DirectoryListing.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import DirectoryAdmin from '../models/DirectoryAdmin.js'; // Use the correct model for login

// @desc    Login as Directory Admin
// @route   POST /api/directory-admin/login
// @access  Public
const loginDirectoryAdmin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) { res.status(401); throw new Error('Please provide credentials'); }

    const admin = await DirectoryAdmin.findOne({ username: username.toLowerCase() });

    if (admin && (await admin.matchPassword(password))) {
        const token = jwt.sign({ id: admin._id, role: 'directory_admin' }, process.env.DIRECTORY_ADMIN_JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } else {
        res.status(401); throw new Error('Invalid credentials');
    }
});

// @desc    Admin creates a new manual directory listing
// @route   POST /api/admin/directory-listings
// @access  Private/Admin
const createDirectoryListing = asyncHandler(async (req, res) => {
    const { name, publicAddress, publicPhone, publicEmail, city, country, description, logoUrl } = req.body;

    if (!name) {
        res.status(400);
        throw new Error('Business name is required.');
    }
    // Check for duplicates in both Tenants and other DirectoryListings if needed, but for simplicity, just check here.
    const listingExists = await DirectoryListing.findOne({ name });
    if (listingExists) {
        res.status(400);
        throw new Error('A business with this name already exists in the manual directory.');
    }

    const listing = await DirectoryListing.create({
        name, publicAddress, publicPhone, publicEmail,
        city, country, description, logoUrl
    });
    res.status(201).json(listing);
});

// @desc    Admin gets all manual directory listings
// @route   GET /api/admin/directory-listings
// @access  Private/Admin
const getAllDirectoryListings = asyncHandler(async (req, res) => {
    const listings = await DirectoryListing.find({}).sort({ name: 1 });
    res.json(listings);
});

// @desc    Admin updates a manual directory listing
// @route   PUT /api/admin/directory-listings/:id
// @access  Private/Admin
const updateDirectoryListing = asyncHandler(async (req, res) => {
    const listing = await DirectoryListing.findById(req.params.id);
    if (!listing) {
        res.status(404);
        throw new Error('Directory listing not found.');
    }
    
    // Update fields from request body
    const { name, publicAddress, publicPhone, publicEmail, city, country, description, logoUrl, isActive } = req.body;
    
    if (name) listing.name = name;
    if (publicAddress !== undefined) listing.publicAddress = publicAddress;
    if (publicPhone !== undefined) listing.publicPhone = publicPhone;
    if (publicEmail !== undefined) listing.publicEmail = publicEmail;
    if (city !== undefined) listing.city = city;
    if (country !== undefined) listing.country = country;
    if (description !== undefined) listing.description = description;
    if (logoUrl !== undefined) listing.logoUrl = logoUrl;
    if (isActive !== undefined) listing.isActive = isActive;

    const updatedListing = await listing.save();
    res.json(updatedListing);
});

// @desc    Admin deletes a manual directory listing
// @route   DELETE /api/admin/directory-listings/:id
// @access  Private/Admin
const deleteDirectoryListing = asyncHandler(async (req, res) => {
    const listing = await DirectoryListing.findById(req.params.id);
    if (!listing) {
        res.status(404);
        throw new Error('Directory listing not found.');
    }
    await listing.deleteOne();
    res.json({ message: `Listing "${listing.name}" has been deleted.` });
});

export {
    loginDirectoryAdmin,
    createDirectoryListing,
    getAllDirectoryListings,
    updateDirectoryListing,
    deleteDirectoryListing,
};