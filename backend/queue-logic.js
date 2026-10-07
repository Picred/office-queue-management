import { getQueuesByCounter, updateTicket } from './dao.js';

//Returns the next client { tId, code, serviceName } or null if every queue the counter can serve is empty

const getNextTicket = async (cId) => {
  const queues = await getQueuesByCounter(cId);
  if (queues.length === 0) return null;   // nothing to do

  let selectedQueue = null;
  let maxQueueLength = 0;
  let selectedServiceTime = 0;

  for (const queue of queues) {
    if (queue.tickets.length > maxQueueLength) {
      maxQueueLength = queue.tickets.length;
      selectedQueue = queue;
      selectedServiceTime = queue.serviceTime;
    }
    else if (queue.tickets.length === maxQueueLength && queue.serviceTime < selectedServiceTime) {
      selectedQueue = queue;
      selectedServiceTime = queue.serviceTime;
    }
  }

  const nextTicket = selectedQueue.tickets[0];

  const updated = await updateTicket(nextTicket.tId, cId);

  if (updated) {
    return {
      tId: nextTicket.tId,
      code: nextTicket.code,
      serviceName: selectedQueue.serviceName
    };
  } else {
    return getNextTicket(cId);
  }

};

export { getNextTicket };