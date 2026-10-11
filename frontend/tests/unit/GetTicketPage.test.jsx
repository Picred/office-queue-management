import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GetTicketPage from "../../src/pages/GetTicketPage";
import { getServices, createTicket } from "../../src/API/api";

// The page talks to the backend only through api.js: replace it, so no WebSocket is opened
vi.mock("../../src/API/api", () => ({
    getServices: vi.fn(),
    createTicket: vi.fn(),
}));

const services = [
    { sId: 1, name: "Shipping", tag: "S", service_time: 10 },
    { sId: 2, name: "Accounts management", tag: "A", service_time: 8 },
];

beforeEach(() => {
    vi.mocked(getServices).mockReset().mockResolvedValue(services);
    vi.mocked(createTicket).mockReset();
});

afterEach(cleanup);

describe("GetTicketPage", () => {
    it("shows a button for each service", async () => {
        render(<GetTicketPage />);

        expect(await screen.findByRole("button", { name: "Shipping" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Accounts management" })).toBeTruthy();
    });

    it("asks for the ticket of the clicked service and shows it", async () => {
        createTicket.mockResolvedValue({ code: "A3", timestamp: "2026-10-07T09:00:00.000Z" });
        render(<GetTicketPage />);

        await userEvent.click(await screen.findByRole("button", { name: "Accounts management" }));

        expect(createTicket).toHaveBeenCalledWith(2, "A");
        expect(await screen.findByText("A3")).toBeTruthy();
        expect(screen.getByText("Accounts management")).toBeTruthy();
    });

    it("goes back to the list of services with 'Get another ticket'", async () => {
        createTicket.mockResolvedValue({ code: "S1", timestamp: "2026-10-07T09:00:00.000Z" });
        render(<GetTicketPage />);
        await userEvent.click(await screen.findByRole("button", { name: "Shipping" }));

        await userEvent.click(await screen.findByRole("button", { name: "Get another ticket" }));

        expect(screen.getByRole("button", { name: "Shipping" })).toBeTruthy();
        expect(screen.queryByText("S1")).toBeNull();
    });

    it("shows the error when the services can't be loaded", async () => {
        getServices.mockRejectedValue(new Error("Failed to retrieve services."));
        render(<GetTicketPage />);

        expect((await screen.findByRole("alert")).textContent).toBe("Failed to retrieve services.");
    });

});
