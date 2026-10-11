import { describe, it, expect, vi, beforeEach } from "vitest";
import { getNextTicket } from "../../queue-logic.js";
import * as dao from "../../dao.js";

vi.mock("../../dao.js", () => ({
  getQueuesByCounter: vi.fn(),
  updateTicket: vi.fn()
}));

describe("queue-logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when the counter has no filled queues", async () => {
    dao.getQueuesByCounter.mockResolvedValue([]);

    const result = await getNextTicket(1);

    expect(result).toBeNull();
    expect(dao.getQueuesByCounter).toHaveBeenCalledWith(1);
    expect(dao.updateTicket).not.toHaveBeenCalled();
  });

  it("slect the ticket from the longest queue", async () => {
    // Queue A: 1 ticket, Queue B: 2 tickets
    dao.getQueuesByCounter.mockResolvedValue([
      {
        serviceName: "Shipping",
        serviceTime: 10,
        tickets: [{ tId: 101, code: "S001" }]
      },
      {
        serviceName: "Deposits",
        serviceTime: 5,
        tickets: [{ tId: 201, code: "D001" }, { tId: 202, code: "D002" }]
      }
    ]);

    dao.updateTicket.mockResolvedValue(true);

    const result = await getNextTicket(1);

    // ticket from queue B
    expect(result).toEqual({
      tId: 201,
      code: "D001",
      serviceName: "Deposits"
    });

    expect(dao.updateTicket).toHaveBeenCalledWith(201, 1);
  });



  it("both queues have the same length and the shortest service time must be selected", async () => {
    // Shipping: serviceTime 10 --- Accounts management: serviceTime 8 (winner)
    dao.getQueuesByCounter.mockResolvedValue([
      {
        serviceName: "Shipping",
        serviceTime: 10,
        tickets: [{ tId: 101, code: "S001" }]
      },
      {
        serviceName: "Accounts management",
        serviceTime: 8,
        tickets: [{ tId: 102, code: "A001" }]
      }
    ]);
    dao.updateTicket.mockResolvedValue(true);

    const result = await getNextTicket(1);

    expect(result).toEqual({
      tId: 102,
      code: "A001",
      serviceName: "Accounts management"
    });
    expect(dao.updateTicket).toHaveBeenCalledWith(102, 1);
  });

  it("call the same method if race condition occurs", async () => {
    // first time it'll fail (another person took ticket)
    // second time the queue is empty
    dao.getQueuesByCounter
      .mockResolvedValueOnce([
        {
          serviceName: "Shipping",
          serviceTime: 10,
          tickets: [{ tId: 101, code: "S01" }]
        }
      ]).mockResolvedValueOnce([]); // Chiamata ricorsiva successiva

    dao.updateTicket.mockResolvedValueOnce(false); // update failed

    const result = await getNextTicket(1);

    expect(result).toBeNull();
    expect(dao.getQueuesByCounter).toHaveBeenCalledTimes(2);
  });
});