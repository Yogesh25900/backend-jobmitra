const buffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
const counters = new Int32Array(buffer);

export const incrementApplicationsInFlight = (): number => {
  const previous = Atomics.add(counters, 0, 1);
  return previous + 1;
};

export const decrementApplicationsInFlight = (): number => {
  const previous = Atomics.sub(counters, 0, 1);
  return Math.max(0, previous - 1);
};

export const getApplicationsInFlight = (): number => {
  return Atomics.load(counters, 0);
};
