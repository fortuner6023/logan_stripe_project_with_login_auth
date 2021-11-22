const express = require("express");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 3000;

// Copy the .env.example in the root into a .env file in this folder
const envFilePath = path.resolve(__dirname, "./.env");
const env = require("dotenv").config({ path: envFilePath });
if (env.error) {
  throw new Error(
    `Unable to load the .env file from ${envFilePath}. Please copy .env.example to ${envFilePath}`
  );
}

// const stripe = require("stripe")(process.env.STRIPE_TEST_SECRET_KEY);
const stripe = require("stripe")(process.env.STRIPE_LIVE_SECRET_KEY);
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

// app.get("/courses", (req, res) => {
//   const filePath = path.resolve(staticDir + "/memberships.html");
//   res.sendFile(filePath);
// });

app.get("/setup", (req, res) => {
  res.send({
    // publishableKey: process.env.STRIPE_TEST_PUBLISHABLE_KEY,
    publishableKey: process.env.STRIPE_LIVE_PUBLISHABLE_KEY,

    basicMonthlyPrice: process.env.BASIC_PRICE_MONTHLY_ID,
    premiumMonthlyPrice: process.env.PREMIUM_PRICE_MONTHLY_ID,
    proMonthlyPrice: process.env.PRO_PRICE_MONTHLY_ID,


    basicYearlyPrice: process.env.BASIC_PRICE_YEARLY_ID,
    premiumYearlyPrice: process.env.PREMIUM_PRICE_YEARLY_ID,
    proYearlyPrice: process.env.PRO_PRICE_YEARLY_ID,

  });
});

// Fetch the Checkout Session to display the JSON result on the success page
app.get("/checkout-session", async (req, res) => {
  const { sessionId } = req.query;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  res.send(session);
});

app.post("/create-checkout-session", async (req, res) => {
  const domainURL = process.env.DOMAIN;
  const { priceId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      payment_method_types: ["card"],
      subscription_data: {
        trial_period_days: 7,
      },
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
