import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Alert } from 'react-bootstrap';
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
        <Container className="py-5">
            {!ticket ? (
                <>
                    <h1 className="text-center mb-3">Get a Ticket</h1>

                    <p className="text-center text-secondary mb-5">
                        Select the service you need
                    </p>

                    {error && (
                        <Alert variant="danger" className="text-center">
                            {error}
                        </Alert>
                    )}

                    <Row className="g-4 justify-content-center">
                        {services.map((service) => (
                            <Col xs={12} md={6} key={service.sId}>
                                <Button
                                    variant="primary"
                                    className="w-100 py-5 fs-4"
                                    onClick={() => handleServiceSelection(service)}
                                >
                                    {service.name}
                                </Button>
                            </Col>
                        ))}
                    </Row>
                </>
            ) : (
                <div className="text-center">
                    <h1 className="mb-4">Your Ticket</h1>

                    <Card className="mx-auto" style={{ maxWidth: '500px' }}>
                        <Card.Body className="p-5">
                            <h2 className="display-1 fw-bold mb-3">
                                {ticket.code}
                            </h2>

                            <p className="fs-4 mb-4">
                                {ticket.serviceName}
                            </p>

                            <p className="text-secondary mb-4">
                                Issued at {new Date(ticket.timestamp).toLocaleTimeString()}
                            </p>

                            <Button
                                variant="outline-primary"
                                onClick={() => setTicket(null)}
                            >
                                Get another ticket
                            </Button>
                        </Card.Body>
                    </Card>
                </div>
            )}
        </Container>
    );
}

export default GetTicketPage;