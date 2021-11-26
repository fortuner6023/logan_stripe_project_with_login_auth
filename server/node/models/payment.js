const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  customer_email: {
    type: String,
  },
  customerId: {
    type: String,
  },
  subscriptionId: {
    type: String,
  },
  customerPortal: {
    type: String,
  },
  canceled_at: {
    type: String,
  },
});

const User = mongoose.model("UsersInfo", paymentSchema);

module.exports = User;


