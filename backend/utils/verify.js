/**
 * utils/verify.js
 *
 * Authors:
 *   Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.
 *
 * Description:
 * File provides functionality for verifying credentials, input values,...
 *
 */

// Function finds/parses requested data and returns it.
//
// Arguments:
// - request: This has to be express callback function's request.
//
// Returns:
// - requested data in JSON format if data is not null.
// - null if requested data is null or an app cannot handle request.
function getRequestedData(request) {
  if (request.body) {
    return request.body;
  } if (request.query) {
    return request.query;
  } if (request.params) {
    return request.params;
  }

  return null;
}



// Check if a given object is valid JSON object.
//
// Arguments:
// - obj: The object which is to be checked.
//
// Returns JSON object if it is a JSON object, null otherwise.
function IsValidJSON(obj) {
  // Check if obj is string, otherwise JSON.stringify() it, then parse.
  if (typeof obj !== 'string') {
    obj = JSON.stringify(obj);
  }

  try {
    const is_json = JSON.parse(obj);
    // This is for null, as "null" is a valid JSON and type of null is
    // object, but "null" is itself false if is_json is null then
    // if (is_JSON && ...) will be false.
    if (is_json && typeof is_json === 'object') {
      return is_json;
    }

    return null;
  } catch (e) {
    return null;
  }
}



// Function does basic verification of user request.
//
// Arguments:
// - request: Raw request data.
// - json_keys: A list of keys which JSON request must contain.
//
// Function returns JSON object, format of which is this:
// {error: error_msg, data: requested_data}
// If verification goes well an error value will be null and data value will
// contain requested data, otherwise an error value will be error message and
// data value will be null.
function BasicVerificationOfRequest(request, json_keys) {
  const basic_verify_obj = {error: null, data: null};

  const requested_data = getRequestedData(request);
  if (!requested_data) {
    basic_verify_obj.error = 'Cannot handle a request or JSON object is an empty.';
    return basic_verify_obj;
  }


  const is_json = IsValidJSON(requested_data);
  if (is_json === false) {
    basic_verify_obj.error = 'Not valid JSON object provided.';
    return basic_verify_obj;
  }


  // Get number of properties in order to verify request object. It has to be correct.
  const num_properties = Number((Object.keys(requested_data)).length);
  if (num_properties !== Number(json_keys.length)) {
    basic_verify_obj.error = 'JSON object does not contain correct number of properties.';
    return basic_verify_obj;
  }

  basic_verify_obj.data = requested_data;

  return basic_verify_obj;
}



// Function checks if a JSON is empty.
function IsEmptyObj(obj) {
  return Object.keys(obj).length === 0;
}

module.exports.BasicVerificationOfRequest = BasicVerificationOfRequest;
module.exports.IsValidJSON = IsValidJSON;
module.exports.IsEmptyObj = IsEmptyObj;

