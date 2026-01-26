import Listing from "../models/listing.model.js";
import { errorHandler } from "../utils/error.js";

export const createListing = async (req, res, next) => {
  try {
    const listing = await Listing.create(req.body);
    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    // Skip ownership check if admin route (no verifyToken middleware)
    if (req.user && req.user.id !== listing.userRef) {
      return res.status(403).json({ success: false, message: "You can only delete your own listings" });
    }

    await Listing.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Listing has been deleted!" });
  } catch (error) {
    console.error('Delete listing error:', error);
    return res.status(500).json({ success: false, message: "Error deleting listing" });
  }
};

export const updateListing = async (req, res, next) => {
  try {
    const listingId = req.params.id;
    
    // Verify listing exists
    const existingListing = await Listing.findById(listingId);
    if (!existingListing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    // Skip ownership check if admin route (no verifyToken middleware)
    if (req.user && req.user.id !== existingListing.userRef) {
      return res.status(403).json({ success: false, message: "You can only update your own listings" });
    }

    // Remove fields that should not be updated
    const { _id, __v, userRef, createdAt, ...updateData } = req.body;

    // Update existing document only
    const updatedListing = await Listing.findByIdAndUpdate(
      listingId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedListing) {
      return res.status(404).json({ success: false, message: "Failed to update listing" });
    }
    
    return res.status(200).json(updatedListing);
  } catch (error) {
    console.error('Update listing error:', error);
    return res.status(500).json({ success: false, message: "Error updating listing" });
  }
};

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return next(errorHandler(404, "Listing not found!"));

    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;

    const startIndex = parseInt(req.query.startIndex) || 0;

    let offer = req.query.offer;

    if (offer === undefined || offer === "false") {
      offer = { $in: [false, true] };
    }

    let furnished = req.query.furnished;

    if (furnished === undefined || furnished === "false") {
      furnished = { $in: [false, true] };
    }

    let parking = req.query.parking;

    if (parking === undefined || parking === "false") {
      parking = { $in: [false, true] };
    }

    let type = req.query.type;

    if (type === undefined || type === "all") {
      type = { $in: ["sale", "rent"] };
    }

    const searchTerm = req.query.searchTerm || "";

    const sort = req.query.sort || "createdAt";

    const order = req.query.order || "desc";

    const listings = await Listing.find({
      name: { $regex: searchTerm, $options: "i" },
      offer,
      furnished,
      type,
      // parking,
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};