(() => {
  "use strict";

  const STORAGE_KEY = "taxiCountPrototype.v1";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const defaultState = () => ({
    passengerCount: 0,
    capacity: null,
    taxiId: "TC-DEMO",
    status: "AVAILABLE",
    shiftStartedAt: null,
    fares: [],
    trips: [],
    activeTripStartedAt: null
  });

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return defaultState();
      const parsed = JSON.parse(saved);
      return {
        ...defaultState(),
        ...parsed,
        fares: Array.isArray(parsed.fares) ? parsed.fares : [],
        trips: Array.isArray(parsed.trips) ? parsed.trips : []
      };
    } catch (error) {
      console.warn("Could not read saved data:", error);
      return defaultState();
    }
  }

  let state = loadState();
  let toastTimer;
  let pendingConfirm = null;

  const currency = (amount) => new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2
  }).format(Number(amount) || 0);

  const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-ZA", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $("#connectionLabel").textContent = "● Saved on this device";
      return true;
    } catch (error) {
      $("#connectionLabel").textContent = "● Save unavailable";
      showToast("Could not save data in this browser.");
      console.error(error);
      return false;
    }
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function askConfirm(title, message, confirmLabel = "Confirm", callback) {
    const dialog = $("#confirmDialog");
    $("#dialogTitle").textContent = title;
    $("#dialogMessage").textContent = message;
    $("#dialogConfirmBtn").textContent = confirmLabel;
    pendingConfirm = callback;

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else if (window.confirm(`${title}\n\n${message}`)) {
      const action = pendingConfirm;
      pendingConfirm = null;
      if (action) action();
    }
  }

  $("#confirmDialog").addEventListener("close", () => {
    if ($("#confirmDialog").returnValue === "confirm" && pendingConfirm) {
      pendingConfirm();
    }
    pendingConfirm = null;
  });

  function totalFares() {
    return state.fares.reduce(
      (sum, fare) => sum + Number(fare.amount || 0), 0
    );
  }

  function render() {
    const capacity = Number(state.capacity) > 0
      ? Number(state.capacity) : null;

    $("#passengerCount").textContent = state.passengerCount;
    $("#summaryPassengers").textContent = state.passengerCount;
    $("#summaryEarnings").textContent = currency(totalFares());
    $("#fareTotal").textContent = currency(totalFares());
    $("#summaryTrips").textContent = state.trips.length;
    $("#tripCountLabel").textContent = `${state.trips.length} saved`;

    $("#capacitySummary").textContent = capacity
      ? `of ${capacity} seats configured`
      : "Capacity not set";

    $("#capacityLine").textContent = capacity
      ? `${state.passengerCount} of ${capacity} passengers`
      : "Set a capacity in settings to enable a limit.";

    $("#fullBadge").classList.toggle(
      "hidden",
      !(capacity && state.passengerCount >= capacity)
    );

    $("#plusPassengerBtn").disabled =
      Boolean(capacity && state.passengerCount >= capacity);

    $("#plusPassengerBtn").style.opacity =
      $("#plusPassengerBtn").disabled ? ".55" : "1";

    $("#taxiIdInput").value = state.taxiId || "";
    $("#capacityInput").value = capacity || "";
    $("#currentStatus").textContent = state.status;

    const statusColors = {
      AVAILABLE: "var(--green)",
      BOARDING: "var(--yellow)",
      TRAVELLING: "var(--red)"
    };

    $("#statusPulse").style.background =
      statusColors[state.status] || "var(--green)";

    $$(".status-option").forEach((button) => {
      const selected = button.dataset.status === state.status;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    $("#shiftStarted").textContent = state.shiftStartedAt
      ? formatDateTime(state.shiftStartedAt) : "Not started";

    $("#startShiftBtn").textContent =
      state.shiftStartedAt ? "Shift active" : "Start shift";

    $("#startShiftBtn").disabled = Boolean(state.shiftStartedAt);
    $("#startShiftBtn").style.opacity =
      state.shiftStartedAt ? ".55" : "1";

    renderFares();
    renderTrips();
  }

  function renderFares() {
    const rows = $("#fareRows");
    rows.replaceChildren();

    if (!state.fares.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 3;
      td.className = "empty-state";
      td.textContent = "No fares recorded yet. Add your first fare above.";
      tr.appendChild(td);
      rows.appendChild(tr);
      return;
    }

    [...state.fares].reverse().forEach((fare) => {
      const tr = document.createElement("tr");
      const amount = document.createElement("td");
      amount.textContent = currency(fare.amount);

      const time = document.createElement("td");
      time.textContent = formatDateTime(fare.createdAt);

      const actionCell = document.createElement("td");
      actionCell.className = "align-right";

      const remove = document.createElement("button");
      remove.className = "delete-fare";
      remove.type = "button";
      remove.textContent = "Remove";

      remove.addEventListener("click", () => askConfirm(
        "Remove this fare?",
        `Remove the ${currency(fare.amount)} fare from this device's records?`,
        "Remove fare",
        () => {
          state.fares = state.fares.filter(item => item.id !== fare.id);
          saveState();
          render();
          showToast("Fare removed.");
        }
      ));

      actionCell.appendChild(remove);
      tr.append(amount, time, actionCell);
      rows.appendChild(tr);
    });
  }

  function renderTrips() {
    const list = $("#tripHistory");
    list.replaceChildren();

    if (!state.trips.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Completed trips will appear here.";
      list.appendChild(empty);
      return;
    }

    state.trips.slice().reverse().slice(0, 8).forEach((trip, index) => {
      const row = document.createElement("div");
      row.className = "activity-row";

      const icon = document.createElement("span");
      icon.className = "activity-icon";
      icon.textContent = "✓";

      const detail = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = `Trip ${state.trips.length - index}`;

      const meta = document.createElement("small");
      meta.textContent =
        `${formatDateTime(trip.startedAt)} – ${formatDateTime(trip.endedAt)}`;

      const count = document.createElement("span");
      count.className = "trip-count";
      count.textContent = `${trip.finalPassengerCount} pax`;

      detail.append(title, meta);
      row.append(icon, detail, count);
      list.appendChild(row);
    });
  }

  function setStatus(status) {
    state.status = status;
    saveState();
    render();
    showToast(`Taxi status set to ${status.toLowerCase()}.`);
  }

  $("#plusPassengerBtn").addEventListener("click", () => {
    const capacity = Number(state.capacity) > 0
      ? Number(state.capacity) : null;

    if (capacity && state.passengerCount >= capacity) {
      showToast("Capacity reached. No more passengers can be added.");
      return;
    }

    if (!state.activeTripStartedAt) {
      state.activeTripStartedAt = new Date().toISOString();
    }

    state.passengerCount += 1;
    $("#counterMessage").textContent = "Passenger boarded — count updated.";
    saveState();
    render();

    if (capacity && state.passengerCount === capacity) {
      showToast("Capacity reached. Your taxi is full.");
    }
  });

  $("#minusPassengerBtn").addEventListener("click", () => {
    if (state.passengerCount <= 0) {
      showToast("Passenger count cannot go below zero.");
      $("#counterMessage").textContent = "Count is already zero.";
      return;
    }

    if (!state.activeTripStartedAt) {
      state.activeTripStartedAt = new Date().toISOString();
    }

    state.passengerCount -= 1;
    $("#counterMessage").textContent = "Passenger exited — count updated.";
    saveState();
    render();
  });

  $$(".status-option").forEach((button) => {
    button.addEventListener("click", () => setStatus(button.dataset.status));
  });

  $("#saveSettingsBtn").addEventListener("click", () => {
    const rawCapacity = $("#capacityInput").value.trim();
    const rawTaxiId = $("#taxiIdInput").value.trim();

    if (rawCapacity &&
        (!Number.isInteger(Number(rawCapacity)) ||
         Number(rawCapacity) < 1 || Number(rawCapacity) > 100)) {
      showToast("Capacity must be a whole number between 1 and 100.");
      $("#capacityInput").focus();
      return;
    }

    const capacity = rawCapacity ? Number(rawCapacity) : null;

    if (capacity && state.passengerCount > capacity) {
      showToast(`Capacity cannot be lower than the current count (${state.passengerCount}).`);
      $("#capacityInput").focus();
      return;
    }

    state.capacity = capacity;
    state.taxiId = rawTaxiId || "TC-DEMO";
    saveState();
    render();
    showToast("Taxi settings saved on this device.");
  });

  $("#fareForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const amount = Number($("#fareAmount").value);

    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      showToast("Enter a fare greater than R0.00 and no more than R100,000.");
      return;
    }

    state.fares.push({
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
      amount: Math.round(amount * 100) / 100,
      createdAt: new Date().toISOString()
    });

    saveState();
    render();
    $("#fareAmount").value = "";
    showToast(`${currency(amount)} fare recorded.`);
  });

  $("#startShiftBtn").addEventListener("click", () => {
    if (state.shiftStartedAt) return;

    state.shiftStartedAt = new Date().toISOString();

    if (!state.activeTripStartedAt) {
      state.activeTripStartedAt = state.shiftStartedAt;
    }

    saveState();
    render();
    showToast("Shift started.");
  });

  $("#endTripBtn").addEventListener("click", () => {
    const saveTrip = () => {
      const now = new Date().toISOString();

      state.trips.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        taxiId: state.taxiId,
        startedAt: state.activeTripStartedAt || now,
        endedAt: now,
        finalPassengerCount: state.passengerCount
      });

      state.activeTripStartedAt = null;
      state.passengerCount = 0;
      state.status = "AVAILABLE";

      saveState();
      render();
      showToast("Trip summary saved. Passenger count reset.");
    };

    const message = state.passengerCount > 0
      ? `There are ${state.passengerCount} passengers still counted. Save the trip and reset the count to zero?`
      : "Save a trip summary and reset the counter for the next trip?";

    askConfirm(
      state.passengerCount > 0
        ? "End trip with passengers counted?"
        : "End and save this trip?",
      message,
      "End trip & save",
      saveTrip
    );
  });

  $("#resetCountBtn").addEventListener("click", () => {
    if (state.passengerCount === 0) {
      showToast("Passenger count is already zero.");
      return;
    }

    askConfirm(
      "Reset passenger count?",
      `This will reset the current count of ${state.passengerCount} to zero without saving a trip.`,
      "Reset count",
      () => {
        state.passengerCount = 0;
        saveState();
        render();
        showToast("Passenger count reset.");
      }
    );
  });

  $("#clearDataBtn").addEventListener("click", () => {
    askConfirm(
      "Clear all demo data?",
      "This removes this browser's saved passenger count, settings, fares and trip history. This cannot be undone.",
      "Clear all data",
      () => {
        state = defaultState();
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          console.warn(error);
        }
        render();
        $("#connectionLabel").textContent = "● Offline demo mode";
        showToast("Demo data cleared.");
      }
    );
  });

  window.addEventListener("online", () => {
    $("#connectionLabel").textContent = "● Online, but no shared backend";
  });

  window.addEventListener("offline", () => {
    $("#connectionLabel").textContent = "● Offline demo mode";
  });

  render();

  if (navigator.onLine) {
    $("#connectionLabel").textContent = "● Local demo · no backend";
  } else {
    $("#connectionLabel").textContent = "● Offline demo mode";
  }
})();
