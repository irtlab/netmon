export function jsonifyError(res, error) {
  const code = error.http_code || 500;
  const reason = error.http_reason || 'Internal Server Error';
  res.statusMessage = reason;
  res.status(code);
  res.type('application/json');
  res.json({
    code: code,
    reason: reason,
    message: error.message
  });
}


export const jsonify = (fn) => async (req, res, next) => {
  try {
    const rv = await fn(req, res, next);
    if (typeof rv !== 'undefined') res.json(rv);
  } catch (error) {
    try {
      jsonifyError(res, error);
    } catch (e) {
      // If we get an error here, it's most likely because jsonifyError
      // attempted to set headers after they have been sent by express. Not
      // much we can do about it other than notify the admin on the console.
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }
};


export function getAllDevices(agents: Array<any>): Array<any> {
  let all_devices: Array<any> = [];

  agents.forEach((agent: any) => {
    all_devices = all_devices.concat(Object.values(agent.visible_devices));
    agent.visible_devices = {};
    agent.link_data = [];
    all_devices.push(agent);
  });

  return all_devices;
};
