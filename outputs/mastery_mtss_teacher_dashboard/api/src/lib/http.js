function json(status, body, headers = {}) {
  return {
    status,
    jsonBody: body,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  };
}

function errorResponse(error, context) {
  context.error(error);
  const status = Number(error.statusCode) || 500;
  const message = status >= 500 ? "The data service could not complete this request." : error.message;
  return json(status, { error: message });
}

module.exports = { json, errorResponse };
