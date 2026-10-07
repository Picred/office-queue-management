import { getQueuesByCounter } from './dao.js';

//Returns the next client { tId, code, serviceName } or null if every queue the counter can serve is empty

const getNextTicket = async (cId) => {
  const queues = await getQueuesByCounter(cId);
  if (queues.length === 0) return null;   // nothing to do

  /**
   * TODO:
   * - take the LONGEST queue (queues[i].tickets.length);
   * - if two or more queues have the same length, take the one whose service has the LOWEST serviceTime;
   * - take the first ticket of that queue (tickets[0], already the oldest) and return { tId: ticket.tId, code: ticket.code, serviceName: queue.serviceName }
   */
  throw new Error('not implemented');
  //ATTENTION: these are not atomic actions! be cautious with access on db if someone else handled that ticket in the exact same moment
};

export { getNextTicket };