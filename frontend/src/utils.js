import { backendURL } from './api';


export function urlParamChanged(params, portfolios, selected) {
  if ((params.id && portfolios.length && !selected) ||
     (params.id && portfolios.length && selected && params.id !== selected._id)) {
    return portfolios.findIndex((element) => element._id === params.id);
  }
  return -1;
}


export function verifyPlainPassword(password) {
  if (typeof password !== 'string') {
    return null;
  }

  // This regex code will validate password with:
  // 1. Minimum length is 6 and max length is 20.
  // 2. At least include a digit number.
  // 3. At least an upper case and a lower case letter.
  // 4. At least a special character.
  const regex = /^(?=\S{6,20}$)(?=.*?\d)(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[^A-Za-z\s0-9])/;
  return password.match(regex);
}


export function createAlert(notifier, opts = { variant : 'error' }) {
  return function (message, error) {
    if (error && error.response && ((error.response.status === 500) ||
        (error.response.status === 400) || (error.response.status === 401)))  {
      notifier(`${message}: ${error.response.data.message}`, opts);
    } else if (error && error.request) {
      notifier(`${message}: ${error}`, opts);
    } else if (error) {
      notifier(`${message}: ${error.message}`, opts);
    } else {
      notifier(`${message}`, opts);
    }
  };
}


export function hasKey(object, key) {
  const has = Object.prototype.hasOwnProperty;
  return has.call(object, String(key));
}


export function isNumber(value) {
  // Check typeof and make sure it returns number.
  // This code coerces neither booleans nor strings to numbers, although it
  // would be possible to do so if desired.
  if (typeof value !== 'number') {
    return false;
  }
  // Check for NaN, as NaN is a number to typeof.
  // NaN is the only JavaScript value that never equals itself.
  if (value !== Number(value)) {
    return false;
  }

  // Note isNaN() is a broken function, but checking for self-equality works
  // as NaN !== NaN Alternatively check for NaN using Number.isNaN(), an ES2015
  // feature that works how one would expect

  // Check for Infinity and -Infinity.
  // Realistically we want finite numbers, or there was probably a division by
  // 0 somewhere.
  if (value === Infinity || value === !Infinity) {
    return false;
  }

  return true;
}


export function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}


export function listTabText(input_text) {
  let text = '';
  switch (input_text) {
  case 'network_topology':
    text = 'Network Topology';
    break;
  case 'devices':
    text = 'Devices';
    break;
  case 'traffic':
    text = 'Traffic';
    break;
  case 'intrusion_detection':
    text = 'Intrusion Detection';
    break;
  case 'notifications':
    text = 'Notifications';
    break;
  default:
      // DO NOTHING
  }
  return text;
}


function getExchangeData(data_list, exchange_name) {
  for (let i = 0; i < data_list.length; i++) {
    if (data_list[i].name === exchange_name) return data_list[i].data;
  }

  return {};
}


export function getExchangesCoins(data) {
  const result = [];
  const tmp_data = {};

  // The order is matter because I want to take coinbase's coins
  // and then missing coins from the second one and so one.
  ['coinbase', 'kraken', 'bitstamp', 'bittrex'].forEach((exchange) => {
    const exchange_coins = getExchangeData(data, exchange);
    const tickers = Object.keys(exchange_coins);
    tickers.forEach((ticker) => {
      const coin_data = exchange_coins[ticker];
      if (!hasKey(tmp_data, ticker) && coin_data.price.USD) {
        tmp_data[ticker] = 1;
        result.push({
          name: coin_data.name,
          ticker,
          market_cap: Math.round(coin_data.circulating_supply * coin_data.price.USD),
          price: coin_data.price.USD,
          change_utc: coin_data.change_utc.USD,
          change_24h: coin_data.change_24h.USD,
          icon_url: `${backendURL}/public/coin_icons/${ticker}.svg`
        });
      }
    });
  });

  return result;
}
