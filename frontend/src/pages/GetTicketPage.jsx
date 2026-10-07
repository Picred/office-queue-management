import { useState } from 'react';

const services = [
    { sId: 1, name: 'Shipping' },
    { sId: 2, name: 'Accounts management' },
    { sId: 3, name: 'Deposits' },
    { sId: 4, name: 'Payments' }
];

function GetTicketPage() {
    const [ticket, setTicket] = useState(null);

    const handleServiceSelection = (service) => {
        const newTicket = {
            code: `${service.name.charAt(0)}001`,
            serviceName: service.name,
            timestamp: new Date()
        };

        setTicket(newTicket);
    };

    return (
        <div className="container py-5">
            {!ticket ? (
                <>
                    <h1 className="text-center mb-3">Get a Ticket</h1>

                    <p className="text-center text-secondary mb-5">
                        Select the service you need
                    </p>

                    <div className="row g-4 justify-content-center">
                        {services.map((service) => (
                            <div className="col-12 col-md-6" key={service.sId}>
                                <button
                                    type="button"
                                    className="btn btn-primary w-100 py-5 fs-4"
                                    onClick={() => handleServiceSelection(service)}
                                >
                                    {service.name}
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center">
                    <h1 className="mb-4">Your Ticket</h1>

                    <div className="card mx-auto" style={{ maxWidth: '500px' }}>
                        <div className="card-body p-5">
                            <h2 className="display-1 fw-bold mb-3">
                                {ticket.code}
                            </h2>

                            <p className="fs-4 mb-4">
                                {ticket.serviceName}
                            </p>

                            <p className="text-secondary mb-4">
                                Issued at {ticket.timestamp.toLocaleTimeString()}
                            </p>

                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={() => setTicket(null)}
                            >
                                Get another ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GetTicketPage;