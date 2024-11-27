const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  if (!params.has(param)) {
    throw new Error(`Parameter ${param} is missing from the URL query string`);
  }
  return params.get(param);
}

function sendMessageToParent(data) {
  window.parent.postMessage(data, "*"); // Accept messages from any origin
}

function showLoadingIndicator() {
  const loadingDiv = document.createElement("div");
  loadingDiv.id = "loadingIndicator";
  loadingDiv.style.position = "fixed";
  loadingDiv.style.top = "0";
  loadingDiv.style.left = "0";
  loadingDiv.style.width = "100%";
  loadingDiv.style.height = "100%";
  loadingDiv.style.zIndex = "9999";
  loadingDiv.style.display = "flex";
  loadingDiv.style.justifyContent = "center";
  loadingDiv.style.alignItems = "center";

  // Add spinner container
  const spinnerContainer = document.createElement("div");
  spinnerContainer.style.display = "flex";
  spinnerContainer.style.flexDirection = "column";
  spinnerContainer.style.alignItems = "center";

  // Add spinner
  const spinner = document.createElement("div");
  spinner.style.border = "6px solid #f3f3f3"; // Light grey
  spinner.style.borderTop = "6px solid #3498db"; // Blue
  spinner.style.borderRadius = "50%";
  spinner.style.width = "50px";
  spinner.style.height = "50px";
  spinner.style.animation = "spin 1s linear infinite";

  // Add animation styles
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .loading-text {
      margin-top: 10px;
      color: white;
      font-size: 16px;
      font-family: Arial, sans-serif;
    }
  `;

  // Add loading text
  const loadingText = document.createElement("div");
  loadingText.textContent = "Signing you in...";
  loadingText.className = "loading-text";

  document.head.appendChild(style);
  spinnerContainer.appendChild(spinner);
  spinnerContainer.appendChild(loadingText);
  loadingDiv.appendChild(spinnerContainer);
  document.body.appendChild(loadingDiv);
}

function hideLoadingIndicator() {
  const loadingDiv = document.getElementById("loadingIndicator");
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

async function handleCredentialResponse(response) {
  const idToken = response.credential;
  const sessionPublicKey = getQueryParam("publicKey");
  const appId = getQueryParam("appId");

  // Show loading animation
  showLoadingIndicator();

  try {
    const res = await fetch(`${BACKEND_URL}/verify-id-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: window.location.origin,
      },
      body: JSON.stringify({ idToken, sessionPublicKey, appId }),
    });

    if (!res.ok) {
      throw new Error("Authentication failed");
    }

    const { success, userIdHash } = await res.json(); // Extract googleId from the response
    if (!success) {
      throw new Error("Authentication failed");
    }
    sendMessageToParent({ type: "auth-success", userIdHash }); // Send googleId to the parent
  } catch (error) {
    sendMessageToParent({ type: "auth-error", error: error.message });
  } finally {
    // Hide loading animation
    hideLoadingIndicator();
  }
}

window.onload = function () {
  const container = document.getElementById("buttonDiv");
  container.innerHTML = `
    <div style="text-align: center; font-family: Arial, sans-serif; margin-bottom: 20px;">
      <h2 style="color: #333;">Login or sign up</h2>
    </div>
  `;
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
  });
  google.accounts.id.renderButton(container, {
    theme: "outline",
    size: "large",
  });
};
