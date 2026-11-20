window.VETVISION_API_BASE_URL = window.location.port === "5500"
    ? "http://" + window.location.hostname + ":5000"
    : window.location.origin;