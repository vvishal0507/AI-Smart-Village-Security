const serverStatus = document.getElementById("serverStatus");
const statusBadge = document.getElementById("statusBadge");
const statusMessage = document.getElementById("statusMessage");
const riskScore = document.getElementById("riskScore");
const locationText = document.getElementById("location");
const eventTime = document.getElementById("eventTime");
const historyList = document.getElementById("historyList");
const safeBtn = document.getElementById("safeBtn");
const alertBtn = document.getElementById("alertBtn");
const controlMessage = document.getElementById("controlMessage");
const liveDot = document.getElementById("liveDot");

const socket = io();

function formatTime(isoString) {
  if (!isoString) return "--";
  const date = new Date(isoString);
  return date.toLocaleString();
}

function pulseLiveDot() {
  if (!liveDot) return;

  liveDot.style.transform = "scale(1.25)";
  setTimeout(() => {
    liveDot.style.transform = "scale(1)";
  }, 250);
}

function renderEvent(event) {
  const isAlert = event.status === "ALERT";

  statusBadge.textContent = event.status;
  statusBadge.className = `status ${isAlert ? "alert" : "safe"}`;
  statusMessage.textContent = event.message;
  riskScore.textContent = String(event.score);
  locationText.textContent = event.location || "Village Entrance";
  eventTime.textContent = formatTime(event.timestamp);

  pulseLiveDot();
}

function addHistoryItem(event) {
  const div = document.createElement("div");
  div.className = "history-item";

  const isAlert = event.status === "ALERT";

  div.innerHTML = `
    <div class="history-top">
      <strong class="history-status ${isAlert ? "alert" : "safe"}">${event.status}</strong>
      <span>${formatTime(event.timestamp)}</span>
    </div>
    <div><strong>Message:</strong> ${event.message}</div>
    <div><strong>Location:</strong> ${event.location || "Village Entrance"}</div>
    <div><strong>Risk Score:</strong> ${event.score}</div>
  `;

  historyList.prepend(div);

  while (historyList.children.length > 12) {
    historyList.removeChild(historyList.lastChild);
  }
}

async function loadInitialData() {
  try {
    const res = await fetch("/api/latest");
    const data = await res.json();

    if (data.success) {
      serverStatus.textContent = "Backend: Online";
      renderEvent(data.event);
      historyList.innerHTML = "";
      (data.history || []).forEach(addHistoryItem);
    } else {
      serverStatus.textContent = "Backend: Error";
    }
  } catch (error) {
    serverStatus.textContent = "Backend: Offline";
    console.error(error);
  }
}

async function triggerManualEvent(type) {
  try {
    controlMessage.textContent = `Sending manual ${type} event...`;

    safeBtn.disabled = true;
    alertBtn.disabled = true;

    const endpoint = type === "ALERT" ? "/api/manual/alert" : "/api/manual/safe";

    const res = await fetch(endpoint, {
      method: "POST"
    });

    const data = await res.json();

    if (data.success) {
      controlMessage.textContent = `${type} event triggered successfully.`;
    } else {
      controlMessage.textContent = `Failed to trigger ${type} event.`;
    }
  } catch (error) {
    controlMessage.textContent = `Error while triggering ${type} event.`;
    console.error(error);
  } finally {
    safeBtn.disabled = false;
    alertBtn.disabled = false;
  }
}

safeBtn.addEventListener("click", () => triggerManualEvent("SAFE"));
alertBtn.addEventListener("click", () => triggerManualEvent("ALERT"));

socket.on("connect", () => {
  serverStatus.textContent = "Backend: Online + Live";
});

socket.on("security_event", (event) => {
  renderEvent(event);
  addHistoryItem(event);
});

socket.on("disconnect", () => {
  serverStatus.textContent = "Backend: Disconnected";
});

loadInitialData();