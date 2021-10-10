// Function constructs and returns a standard form of response object.
// Every single response to user must be constructed by this function.
//
// Arguments:
// - status_: Status code must be 'ok' or 'error', it depends on response.
// - message: Message should contain clear description of status.
// - data: User data requested by user, it can be null if back-end does not send
//         any data to user. By default it is set null.
//
// Returns a standard form of response object (JSON).
function getResponseObj(status_, message, data = null) {
  const response_obj = {
    status: status_,
    message,
    data
  };

  return response_obj;
}

module.exports.getResponseObj = getResponseObj;

