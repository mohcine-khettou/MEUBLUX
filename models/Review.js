import mongoose from "mongoose";


const reviewSchema = new mongoose.Schema({

    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Please provide rating'],
    },
    comment: {
        type: String,
        required: [true, 'Please provide review text'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true,
    },
},
    { timestamps: true });
reviewSchema.index({ user: 1, product: 1 }, { unique: true })

reviewSchema.statics.calculateAverageRating = async function (productId) {
    const result = await this.aggregate([
        {
            '$match': {
                'product': productId
            }
        }, {
            '$group': {
                _id: null,
                averageRating: {
                    $avg: '$rating'
                },
                numOfReviews: {
                    '$sum': 1
                }
            }
        }
    ])
    try {
        await this.model('Product').findByIdAndUpdate(productId, {
            numOfReviews: result[0]?.numOfReviews || 0,
            averageRating: result[0]?.averageRating || 0
        })
    } catch (error) {
        console.log(error);
    }

}

reviewSchema.post('save', async function () {
    await this.constructor.calculateAverageRating(this.product)
})
reviewSchema.post('remove', async function () {
    await this.constructor.calculateAverageRating(this.product)
})


export default mongoose.model('Review', reviewSchema)