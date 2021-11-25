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

        var flowneticIndicatorMonthlyPriceId = json.flowneticIndicatorMonthly;

        var stripe = Stripe(publishableKey);
        console.log('stripe public key', stripe);

        document
            .getElementById("indicator-monthly-btn")
            .addEventListener("click", function (evt) {
                console.log('event ====>', evt);
                createCheckoutSession(flowneticIndicatorMonthlyPriceId).then(function (data) {
                    console.log('data ====>', data);
                    // Call Stripe.js method to redirect to the new Checkout page
                    stripe
                        .redirectToCheckout({
                            sessionId: data.sessionId,
                        })
                        .then(handleResult);
                });
            });



    });