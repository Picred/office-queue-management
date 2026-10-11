import { useState } from 'react';
import { Container, Row, Col, Button, Alert, Card } from 'react-bootstrap';
import { nextTicket } from "../API/api.js";


// Page for the logged in officers: for now it only shows who is logged in
// (the "Next customer" button will be added here)
function OfficerPage({ user, onLogout }) {

    const [servingTicket, setServingTicket] = useState();
    const [error, setError] = useState("");

    async function CallNextCustomer() {
        try {
            const next = await nextTicket(user.cId)
            setServingTicket(next)
        }
        catch (err) {
            setError(err.message)
        }
    }

    return (
        <Container className="py-5">
            <Card className="mx-auto text-center" style={{ width: '90%', maxWidth: '600px', minHeight: '380px' }}>
                <Card.Body className="p-3">
                    {!servingTicket ? (
                        <>
                            <h1 className="mb-4">Logged in as {user.username}</h1>
                            <h2 className="text-center mb-3">Call the next customer to be served at cash number {user.cId}</h2>

                            {error && (
                                <Alert variant="danger" className="text-center">
                                    {error}
                                </Alert>
                            )}

                            <Container className="d-flex justify-content-center align-items-center">
                                <Row className="justify-content-center">
                                    <Button onClick={CallNextCustomer} size='lg'>
                                        Call next customer
                                    </Button>
                                </Row>
                            </Container>
                        </>

                    ) : (
                        <div className="d-flex justify-content-center align-items-center">
                            <Row className="justify-content-center w-100">
                                <Col xs={12} className="text-center">
                                    <p className="fs-4 text-muted">Now serving the following ticket</p>

                                    <h1 className="display-3 fw-bold text-primary my-3">
                                        {servingTicket.code}
                                    </h1>

                                    <p className="fs-5">Service: {servingTicket.serviceName}</p>
                                    <p className="small text-muted">Ticket ID: {servingTicket.tId}</p>

                                    <Button onClick={() => setServingTicket(null)} size="lg" className="mt-3">
                                        Serving finished
                                    </Button>
                                </Col>
                            </Row>
                        </div>

                    )}

                </Card.Body>
            </Card>
            <Button variant="outline-primary" onClick={onLogout}>
                Logout
            </Button>
        </Container>
    );
}

export default OfficerPage;
