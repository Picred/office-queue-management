import { test as base, expect } from "@playwright/test";

const WS_URL = "ws://localhost:3000";

async function issueTicket(page, serviceName) {
    await page.goto("/");
    await page.getByRole("button", { name: serviceName }).click();
    return page.getByRole("heading", { level: 2 }).textContent();
}

async function callNextAtOnce(page, cIds) {
    return page.evaluate(async ({ url, cIds }) => {
        const sockets = await Promise.all(cIds.map(() => new Promise((resolve) => {
            const socket = new WebSocket(url);
            socket.addEventListener("open", () => resolve(socket));
        })));

        const answers = await Promise.all(sockets.map((socket, i) => new Promise((resolve, reject) => {
            socket.addEventListener("message", (event) => {
                const response = JSON.parse(event.data);
                if (response.type === "next_ticket") resolve(response.data);
                if (response.type === "error") reject(new Error(response.message));
            });
            socket.send(JSON.stringify({ action: "next_ticket", cId: cIds[i] }));
        })));

        sockets.forEach((socket) => socket.close());
        return answers;
    }, { url: WS_URL, cIds });
}

async function emptyQueues(page) {
    await page.goto("/");

    for (const cId of [1, 2, 3, 4]) {
        for (let called = 0; ; called++) {
            const [ticket] = await callNextAtOnce(page, [cId]);
            if (!ticket) break;
            if (called >= 100) throw new Error(`The queues of counter ${cId} do not get empty`);
        }
    }
}

async function loginAs(page, username) {
    await page.goto("/login");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Login" }).click();
 
    await expect(page.getByRole("heading", { name: `Logged in as ${username}` })).toBeVisible();
}

async function callNext({ page, answers }) {
    const before = answers.length;
    await page.getByRole("button", { name: "Call next customer" }).click();

    await expect.poll(() => answers.length).toBe(before + 1);
    return answers[before];
}

async function finishServing({ page }) {
    await page.getByRole("button", { name: "Serving finished" }).click();
    await expect(page.getByRole("button", { name: "Call next customer" })).toBeVisible();
}

const test = base.extend({
    openOfficer: async ({ browser, baseURL }, provide) => {
        const contexts = [];

        await provide(async (username) => {
            const context = await browser.newContext({ baseURL });
            contexts.push(context);
            const page = await context.newPage();

            const answers = [];
            page.on("websocket", (socket) => {
                socket.on("framereceived", ({ payload }) => {
                    const response = JSON.parse(payload.toString());
                    if (response.type === "next_ticket") answers.push(response.data);
                });
            });

            await loginAs(page, username);
            return { page, answers };
        });

        for (const context of contexts) await context.close();
    },
});

test.beforeEach(async ({ page }) => {
    await emptyQueues(page);
});



test("the officer calls the next customer and sees the ticket and its service", async ({ page, openOfficer }) => {
    const code = await issueTicket(page, "Shipping");
    const officer = await openOfficer("counter1");

    await expect(officer.page.getByText("cash number 1")).toBeVisible();
    await officer.page.getByRole("button", { name: "Call next customer" }).click();

    await expect(officer.page.getByText("Now serving the following ticket")).toBeVisible();
    await expect(officer.page.getByRole("heading", { level: 1 })).toHaveText(code);
    await expect(officer.page.getByText("Service: Shipping")).toBeVisible();
});

test("the officer can call another customer once the service is finished", async ({ page, openOfficer }) => {
    const first = await issueTicket(page, "Shipping");
    const second = await issueTicket(page, "Shipping");
    const officer = await openOfficer("counter1");

    await callNext(officer);
    await expect(officer.page.getByRole("heading", { level: 1 })).toHaveText(first);

    await finishServing(officer);
    await callNext(officer);
    await expect(officer.page.getByRole("heading", { level: 1 })).toHaveText(second);
});

test("inside a queue the customer waiting for longer is called first", async ({ page, openOfficer }) => {
    const first = await issueTicket(page, "Shipping");
    const second = await issueTicket(page, "Shipping");
    const third = await issueTicket(page, "Shipping");
    const officer = await openOfficer("counter1");

    const called = [];
    for (let i = 0; i < 3; i++) {
        called.push((await callNext(officer)).code);
        await finishServing(officer);
    }

    expect(called).toEqual([first, second, third]);
});

test("the officer calls the customer of the longest queue, even if another customer arrived before", async ({ page, openOfficer }) => {
    await issueTicket(page, "Accounts management");
    const oldestShipping = await issueTicket(page, "Shipping");
    await issueTicket(page, "Shipping");
    const officer = await openOfficer("counter1");

    const ticket = await callNext(officer);

    expect(ticket.serviceName).toBe("Shipping");
    expect(ticket.code).toBe(oldestShipping);
    await expect(officer.page.getByText("Service: Shipping")).toBeVisible();
});

test("with queues of the same length the service with the lowest service time goes first", async ({ page, openOfficer }) => {
    const shipping = await issueTicket(page, "Shipping");
    const accounts = await issueTicket(page, "Accounts management");
    const officer = await openOfficer("counter1");

    const first = await callNext(officer);
    await expect(officer.page.getByText("Service: Accounts management")).toBeVisible();
    await finishServing(officer);
    const second = await callNext(officer);

    expect(first.code).toBe(accounts);
    expect(second.code).toBe(shipping);
});

test("nothing happens when nobody is waiting", async ({ openOfficer }) => {
    const officer = await openOfficer("counter1");

    const ticket = await callNext(officer);

    expect(ticket).toBeNull();
    await expect(officer.page.getByText("Now serving the following ticket")).toBeHidden();
    await expect(officer.page.getByRole("button", { name: "Call next customer" })).toBeVisible();
    await expect(officer.page.getByRole("alert")).toBeHidden();
});

test("a counter only calls the customers of the services it serves", async ({ page, openOfficer }) => {
    const payments = await issueTicket(page, "Payments");
    const counter1 = await openOfficer("counter1");
    const counter3 = await openOfficer("counter3");

    expect(await callNext(counter1)).toBeNull();
    await expect(counter1.page.getByText("Now serving the following ticket")).toBeHidden();

    await callNext(counter3);
    await expect(counter3.page.getByRole("heading", { level: 1 })).toHaveText(payments);
    await expect(counter3.page.getByText("Service: Payments")).toBeVisible();
});

test("a ticket that was called is not called again", async ({ page, openOfficer }) => {
    const code = await issueTicket(page, "Shipping");
    const counter1 = await openOfficer("counter1");
    const counter2 = await openOfficer("counter2");

    expect((await callNext(counter1)).code).toBe(code);
    await finishServing(counter1);

    expect(await callNext(counter2)).toBeNull();
    expect(await callNext(counter1)).toBeNull();
});

test("two counters calling at the same time get different customers", async ({ page, openOfficer }) => {
    const first = await issueTicket(page, "Shipping");
    const second = await issueTicket(page, "Shipping");
    const counter1 = await openOfficer("counter1");
    const counter2 = await openOfficer("counter2");

    const [ticket1, ticket2] = await Promise.all([callNext(counter1), callNext(counter2)]);

    expect(ticket1.code).not.toBe(ticket2.code);
    expect([ticket1.code, ticket2.code].sort()).toEqual([first, second].sort());
});

test("counters whose requests arrive at the same instant never get the same customer", async ({ page }) => {
    const codes = [
        await issueTicket(page, "Deposits"),
        await issueTicket(page, "Deposits"),
        await issueTicket(page, "Deposits"),
    ];

    const tickets = await callNextAtOnce(page, [2, 3, 4]);

    expect(tickets.map((ticket) => ticket.code).sort()).toEqual(codes.sort());
});

test("only a logged in officer can open the page to call the customers", async ({ page }) => {
    await page.goto("/officer");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Call next customer" })).toBeHidden();
});