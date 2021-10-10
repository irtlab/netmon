import format from 'date-fns/format';

export default (date) => format(new Date(date), 'MMMM D, YYYY');
