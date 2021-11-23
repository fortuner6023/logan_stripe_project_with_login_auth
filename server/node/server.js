const express = require("express");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 3000;
const mongoose = require("mongoose");
const User = require("./models/payment.js");
// Copy the .env.example in the root into a .env file in this folder
const envFilePath = path.resolve(__dirname, "./.env");
const env = require("dotenv").config({ path: envFilePath });
if (env.error) {
  throw new Error(
    `Unable to load the .env file from ${envFilePath}. Please copy .env.example to ${envFilePath}`
  );
}

const db = "mongodb://127.0.0.1:27017/kronos";


// Connect to MongoDB
mongoose
  .connect(process.env.URI || db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: "majority",
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const stripe = require("stripe")(process.env.STRIPE_TEST_SECRET_KEY || "sk_test_51JIhJlL4qV7pV2rEiOnINNP43fswDYZRxiQehwhMx6MdablcCZAmH6eHaduQ2bTng5fvNADjqLy3kg1nRRGNe9sv00hBFgZoly");
// const stripe = require("stripe")(process.env.STRIPE_LIVE_SECRET_KEY || "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");
const staticDir = "./client";
app.use(express.static(process.env.STATIC_DIR || staticDir));
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith("/webhook")) {
        req.rawBody = buf.toString();
      }
    },
  })
);

app.get("/", (req, res) => {
  const filePath = path.resolve(staticDir + "/index.html");
  res.sendFile(filePath);
});

app.get("/memberships", (req, res) => {
  const filePath = path.resolve(staticDir + "/memberships.html");
  res.sendFile(filePath);
});

app.get("/indicators", (req, res) => {
  const filePath = path.resolve(staticDir + "/indicators.html");
  res.sendFile(filePath);
});

app.get("/contact", (req, res) => {
  const filePath = path.resolve(staticDir + "/contact.html");
  res.sendFile(filePath);
});

// app.get("/login", (req, res) => {
//   const filePath = path.resolve(staticDir + "/memberships.html");
//   res.sendFile(filePath);
// });

app.get("/course", (req, res) => {
  const filePath = path.resolve(staticDir + "/course.html");
  res.sendFile(filePath);
});

app.get("/setup", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_TEST_PUBLISHABLE_KEY || "pk_test_51JIhJlL4qV7pV2rEZpS2hhwufybiMvTTkFsZjrrjcENoppsxkSth5H74TWXrScjWyOTbV5SRAhErCWRX1Apnf2Fb009dniZBGm",
    // publishableKey: process.env.STRIPE_LIVE_PUBLISHABLE_KEY || "pk_live_51JIhJlL4qV7pV2rEDGHTePXcWs4wrnwH5tEBFLA0S0ZfB3bh75aenqPDnJQ9UTxIS7sWwSvtVYhbEsMm4d3Ruoxp00tCixaJi1",

    membershipMonthly: process.env.MEMBERSHIP_MONTHLY || "price_1JyW44L4qV7pV2rEWh65H5Vh",
    membershipQuarterly: process.env.MEMBERSHIP_QUARTERLY || "price_1JyW44L4qV7pV2rELVMHa5mi",
    membershipYearly: process.env.MEMBERSHIP_YEARLY || "price_1JyW44L4qV7pV2rEYRZceksX",
    flowneticIndicatorMonthly: process.env.FLOWNETIC_INDICATOR_MONTHLY || "price_1JyW7oL4qV7pV2rELKI5k20b",
    premiumCourse: process.env.PREMIUM_COURSE || "price_1JyW8eL4qV7pV2rEQQNPUceL"
  });
});

// Fetch the Checkout Session to display the JSON result on the success page
// app.get("/checkout-session", async (req, res) => {
//   const { sessionId } = req.query;
//   const session = await stripe.checkout.sessions.retrieve(sessionId);
//   res.send(session);
// });

app.get("/checkout-session", async (req, res) => {
  console.log("req.body and req.query", req.body, req.query);
  const { sessionId } = req.query;
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription", "customer"],
  });

  const customer_email = session.customer.email;
  const customer_id = session.customer.id;
  const subscription_id = session.subscription.id;

  const subscription_info = await stripe.subscriptions.retrieve(
    subscription_id
  );

  const {
    current_period_start,
    current_period_end,
    status,
    cancel_at,
  } = subscription_info;

  // const product_id = subscription_info.plan.product;
  // const product_name = subscription_info.plan.nickname;

  const current_period_starting = current_period_start * 1000;
  const current_period_ending = current_period_end * 1000;
  const current_period_canceled_at = cancel_at * 1000;

  const startDateObject = new Date(current_period_starting);
  const endDateObject = new Date(current_period_ending);
  const canceledObject = new Date(current_period_canceled_at);

  const created_date = startDateObject.toLocaleString(); //2019-12-9 10:30:15
  const end_date = endDateObject.toLocaleString(); //2019-12-9 10:30:15
  // let cancel_date = canceledObject.toLocaleString(); //2019-12-9 10:30:15

  const newUser = new User({
    stripe_user_id: customer_id,
    transaction_id: subscription_id,
    customer_email,
    // product_name,
    // product_id,
    // purchase_date: created_date,
    // expiration_date: end_date,
    // canceled_at: cancel_date,
  });

  const savedUser = await newUser.save();
  console.log("saved user===>", savedUser);

  res.send({ status: "success", paid_status: "paid", savedUser, session });
  // res.send({ status: "success", plan_status: status, savedUser, session });
});


app.post("/create-checkout-session", async (req, res) => {
  const domainURL = process.env.DOMAIN;
  const { priceId } = req.body;
console.log("priceId===>", priceId);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      payment_method_types: ["card"],
      // subscription_data: {
      //   trial_period_days: 7,
      // },
      // billing_address_collection: "required",
      // payment_intent_data: {
      //   shipping: {
      //     phone: "9988123431",
      //   },
      // },
      line_items: [ 
        { 
          price: priceId,
          quantity: 1,
        },
      ], 
      // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
      success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domainURL}/canceled.html`,
    });

    res.send({
      sessionId: session.id,
    });
  } catch (e) {
    res.status(400);
    return res.send({
      error: {
        message: e.message,
      },
    });
  }
});



app.post("/customer-portal", async (req, res) => {
  const { sessionId } = req.body;
  const checkoutsession = await stripe.checkout.sessions.retrieve(sessionId);
  console.log("checkoutSession===>", checkoutsession);

  // This is the url to which the customer will be redirected when they are done
  // managing their billing with the portal.
  const returnUrl = process.env.DOMAIN;

  const portalsession = await stripe.billingPortal.sessions.create({
    customer: checkoutsession.customer,
    return_url: returnUrl,
  });

  res.send({
    url: portalsession.url,
  });
});

// app.post("/subscription-info", async (req, res) => {
//   const { sessionId } = req.body;
//   const checkoutsession = await stripe.checkout.sessions.retrieve(sessionId);

//   const subscriptionInfo = await stripe.subscriptions.retrieve(
//     checkoutsession.subscription
//   );

//   const { id, created, customer, status, current_period_end } =
//     subscriptionInfo;

//   const current_period_start = created * 1000;
//   const current_period_ending = current_period_end * 1000;

//   const startDateObject = new Date(current_period_start);
//   const endDateObject = new Date(current_period_ending);

//   const created_date = startDateObject.toLocaleString(); //2019-12-9 10:30:15
//   const end_date = endDateObject.toLocaleString(); //2019-12-9 10:30:15

//   const customerInfo = await stripe.customers.retrieve(customer);
//   console.log("subscription details ===>", subscriptionInfo);

//   res.send({
//     url: subscriptionInfo,
//     // subscription_details: {
//     //   subscription_Id: id,
//     //   customer_Id: customer,
//     //   customer_email: customerInfo.email,
//     //   product_id: subscriptionInfo.plan.product,
//     //   status: status,
//     //   purchase_date: created_date,
//     //   expiration_date: end_date,
//     //   url: subscriptionInfo,
//     // },
//   });
// });

app.listen(PORT, () =>
  console.log(`Node server listening at http://localhost:${PORT}/`)
);
