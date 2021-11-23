const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("session_id");
let customerId;

if (sessionId) {
  fetch("/checkout-session?sessionId=" + sessionId)
    .then(function (result) {
      return result.json();
    })
    .then(function (session) {
      customerId = session.customer;

      var sessionJSON = JSON.stringify(session, null, 2);
      document.querySelector("pre").textContent = sessionJSON;
    })
    .catch(function (err) {
      console.log("Error when fetching Checkout session", err);
    });

  const manageBillingForm = document.querySelector("#manage-billing-form");

  manageBillingForm.addEventListener("submit", function (e) {
    e.preventDefault();
    fetch("/customer-portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: sessionId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("data", data);
        window.location.href = data.url;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

  // subscription info APIs
  manageSubscription.addEventListener("submit", function (e) {
    e.preventDefault();
    fetch("/subscription-info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: sessionId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("data", data);
        return data.url;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
}
