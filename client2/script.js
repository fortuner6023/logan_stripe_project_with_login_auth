// If a fetch error occurs, log it to the console and show it in the UI.
var handleFetchResult = function (result) {
  if (!result.ok) {
    return result
      .json()
      .then(function (json) {
        if (json.error && json.error.message) {
          throw new Error(
            result.url + " " + result.status + " " + json.error.message
          );
        }
      })
      .catch(function (err) {
        showErrorMessage(err);
        throw err;
      });
  }
  return result.json();
};

// Create a Checkout Session with the selected plan ID
var createCheckoutSession = function (priceId) {
  return fetch("/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      priceId: priceId,
    }),
  }).then(handleFetchResult);
};

// Handle any errors returned from Checkout
var handleResult = function (result) {
  if (result.error) {
    showErrorMessage(result.error.message);
  }
};

var showErrorMessage = function (message) {
  var errorEl = document.getElementById("error-message");
  errorEl.textContent = message;
  errorEl.style.display = "block";
};

/* Get your Stripe publishable key to initialize Stripe.js */
fetch("/setup")
  .then(handleFetchResult)
  .then(function (json) {
    var publishableKey = json.publishableKey;
    
    // var basicPriceId = json.basicPrice;
    // var proPriceId = json.proPrice;

    var basicMonthlyPriceId = json.basicMonthlyPrice;
    var premiumMonthlyPriceId = json.premiumMonthlyPrice;
    var proMonthlyPriceId = json.proMonthlyPrice;
  

    var basicYearlyPriceId = json.basicYearlyPrice;
    var premiumYearlyPriceId = json.premiumYearlyPrice;
    var proYearlyPriceId = json.proYearlyPrice;


    var stripe = Stripe(publishableKey);
    // Setup event handler to create a Checkout Session when button is clicked
    document
      .getElementById("basic-monthly-plan-btn")
      .addEventListener("click", function (evt) {
        createCheckoutSession(basicMonthlyPriceId).then(function (data) {
          // Call Stripe.js method to redirect to the new Checkout page
          stripe
            .redirectToCheckout({
              sessionId: data.sessionId,
            })
            .then(handleResult);
        });
      });

      document
      .getElementById("premium-monthly-plan-btn")
      .addEventListener("click", function (evt) {
        createCheckoutSession(premiumMonthlyPriceId).then(function (data) {
          // Call Stripe.js method to redirect to the new Checkout page
          stripe
            .redirectToCheckout({
              sessionId: data.sessionId,
            })
            .then(handleResult);
        });
      });
  
    // Setup event handler to create a Checkout Session when button is clicked
    document
      .getElementById("pro-monthly-plan-btn")
      .addEventListener("click", function (evt) {
        createCheckoutSession(proMonthlyPriceId).then(function (data) {
          // Call Stripe.js method to redirect to the new Checkout page
          stripe
            .redirectToCheckout({
              sessionId: data.sessionId,
            })
            .then(handleResult);
        });
      });

          // Setup event handler to create a Checkout Session when button is clicked



    document
    .getElementById("basic-yearly-plan-btn")
    .addEventListener("click", function (evt) {
      createCheckoutSession(basicYearlyPriceId).then(function (data) {
        // Call Stripe.js method to redirect to the new Checkout page
        stripe
          .redirectToCheckout({
            sessionId: data.sessionId,
          })
          .then(handleResult);
      });
    });


    document
    .getElementById("premium-yearly-plan-btn")
    .addEventListener("click", function (evt) {
      createCheckoutSession(premiumYearlyPriceId).then(function (data) {
        // Call Stripe.js method to redirect to the new Checkout page
        stripe
          .redirectToCheckout({
            sessionId: data.sessionId,
          })
          .then(handleResult);
      });
    });

    
    document
    .getElementById("pro-yearly-plan-btn")
    .addEventListener("click", function (evt) {
      createCheckoutSession(proYearlyPriceId).then(function (data) {
        // Call Stripe.js method to redirect to the new Checkout page
        stripe
          .redirectToCheckout({
            sessionId: data.sessionId,
          })
          .then(handleResult);
      });
    });


  });
