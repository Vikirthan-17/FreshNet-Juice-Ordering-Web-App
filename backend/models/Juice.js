const mongoose = require("mongoose");

const juiceSchema = new mongoose.Schema (
    {
        name: {
            type:String,
            required: true,
        },
        category: {
            type:String,
            required: true,
            enum: ["juice", "smoothie", "bowl", "shake"]
        },
        price: {
            type:Number,
            required: true,
        },
        description: {
            type:String,
            required: true,
        },
        image: {
            type:String,
            default: "",
        },
        isAvailable: {
            type:Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Juice", juiceSchema);