import Review from '../models/review.js';
import Book from '../models/book.js';

export const addReview = async (req, res) => {
    try {
        const { bookId, rating, comment } = req.body;
        const userId = req.user._id;

        if (!bookId || !rating) {
            return res.json({ success: false, message: 'Book ID and rating are required' });
        }

        // Check if user already reviewed this book
        const existingReview = await Review.findOne({ user: userId, book: bookId });
        if (existingReview) {
            // Optional: update instead of reject? Let's just update if it exists.
            existingReview.rating = rating;
            existingReview.comment = comment;
            await existingReview.save();
            return res.json({ success: true, message: 'Review updated successfully', review: existingReview });
        }

        const newReview = await Review.create({
            user: userId,
            book: bookId,
            rating: Number(rating),
            comment
        });

        res.json({ success: true, message: 'Review submitted successfully', review: newReview });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

export const getCarReviews = async (req, res) => {
    try {
        const { bookId } = req.params;

        const reviews = await Review.find({ book: bookId })
            .populate('user', 'name image') // populate reviewer name and image
            .sort({ createdAt: -1 });

        res.json({ success: true, reviews });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};
