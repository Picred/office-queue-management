import { useState, useEffect } from 'react';
import { getServices, createTicket } from "../API/api";


function GetTicketPage() {
    const [ticket, setTicket] = useState(null);
    const [services, setServices] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadServices() {
            try {
                const data = await getServices();
                setServices(data);
            } catch (err) {
                setError(err.message);
            }
        }

        loadServices();
    }, []);

    async function handleServiceSelection(service) {
        try {
            const data = await createTicket(service.sId, service.tag);

            setTicket({
                ...data,
                serviceName: service.name
            });
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="container py-5">
            {!ticket ? (
                <>
                    <h1 className="text-center mb-3">Get a Ticket</h1>

                    <p className="text-center text-secondary mb-5">
                        Select the service you need
                    </p>

                    {error && (
                        <div className="alert alert-danger text-center" role="alert">
                            {error}
                        </div>
                    )}

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
                                Issued at {new Date(ticket.timestamp).toLocaleTimeString()}
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