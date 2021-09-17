import { helper } from '@ember/component/helper';

export function from_lamport([value]) {
  const result = (value / 1000000000).toFixed(9);
  return result.slice(-1) === '0' ? parseFloat(result) : result;
}

export default helper(from_lamport);
