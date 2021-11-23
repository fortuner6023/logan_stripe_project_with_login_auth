const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  stripe_user_id: {
    type: String,
  },
  customer_email: {
    type: String,
  },
  product_name: {
    type: String,
  },
  product_id: {
    type: String,
  },
  transaction_id: {
    type: String,
  },
  product_name: {
    type: String,
    // required: true,
  },
  product_id: {
    type: String,
  },
  purchase_date: {
    type: String,
  },
  expiration_date: {
    type: String,
  },
  canceled_at: {
    type: String,
  },
});

const User = mongoose.model("UsersInfo", paymentSchema);

module.exports = User;
