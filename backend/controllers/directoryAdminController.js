// server/controllers/directoryAdminController.js
import asyncHandler from '../middleware/asyncHandler.js';
import DirectoryListing from '../models/DirectoryListing.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import DirectoryAdmin from '../models/DirectoryAdmin.js'; // Use the correct model for login
import Tenant from '../models/Tenant.js';

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
    const { name, publicAddress, publicPhone, publicEmail, city, country, description, logoUrl, logoCloudinaryId } = req.body;
    
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
        city, country, description, logoUrl, logoCloudinaryId
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
    const { name, publicAddress, publicPhone, publicEmail, city, country, description, logoUrl, logoCloudinaryId, isActive } = req.body;
    
    if (name) listing.name = name;
    if (publicAddress !== undefined) listing.publicAddress = publicAddress;
    if (publicPhone !== undefined) listing.publicPhone = publicPhone;
    if (publicEmail !== undefined) listing.publicEmail = publicEmail;
    if (city !== undefined) listing.city = city;
    if (country !== undefined) listing.country = country;
    if (description !== undefined) listing.description = description;
    if (logoUrl !== undefined) listing.logoUrl = logoUrl;
    if (isActive !== undefined) listing.isActive = isActive;
    if (logoUrl !== undefined) listing.logoUrl = logoUrl;
    if (logoCloudinaryId !== undefined) listing.logoCloudinaryId = logoCloudinaryId;

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
// @desc    Admin gets a list of all tenants (software customers)
// @route   GET /api/admin/tenants
// @access  Private/Admin
const getAllTenants = asyncHandler(async (req, res) => {
    const tenants = await Tenant.find({}).sort({ name: 1 });
    res.json(tenants);
});
// @desc    Admin updates a tenant's public profile details
// @route   PUT /api/admin/tenants/:id
// @access  Private/Admin
const updateTenant = asyncHandler(async (req, res) => {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
        res.status(404); throw new Error('Software Customer (Tenant) not found.');
    }
    
    // Whitelist the fields an admin can change for a tenant's public profile
    const { isListedInDirectory, publicAddress, publicPhone, publicEmail, city, country, description, logoUrl } = req.body;

    if (isListedInDirectory !== undefined) tenant.isListedInDirectory = isListedInDirectory;
    if (publicAddress !== undefined) tenant.publicAddress = publicAddress;
    if (publicPhone !== undefined) tenant.publicPhone = publicPhone;
    if (publicEmail !== undefined) tenant.publicEmail = publicEmail;
    if (city !== undefined) tenant.city = city;
    if (country !== undefined) tenant.country = country;
    if (description !== undefined) tenant.description = description;
    if (logoUrl !== undefined) tenant.logoUrl = logoUrl;
    
    const updatedTenant = await tenant.save();
    res.json(updatedTenant);
});
// @desc    Super Admin gets a single tenant by ID
// @route   GET /api/platform-admin/tenants/:id
// @access  Private/SuperAdmin
const getTenantById = asyncHandler(async (req, res) => {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) { res.status(404); throw new Error('Tenant not found.'); }
    res.json(tenant);
});

export {
    loginDirectoryAdmin,
    createDirectoryListing,
    getAllDirectoryListings,
    updateDirectoryListing,
    deleteDirectoryListing,
    getAllTenants,
    updateTenant,
    getTenantById
};