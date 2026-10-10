import { useState } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { nextTicket } from "../API/api.js";
import { useParams } from 'react-router-dom';


function CashierPage() {
    const [servingTicket, setServingTicket] = useState();
    const [error, setError] = useState("");
    const { cashierId: cashierIdParam } = useParams();
    const cashierId = Number(cashierIdParam)

    async function CallNextCustomer() {
        try {
            const next = await nextTicket(cashierId)
            setServingTicket(next)
        }
        catch (err) {
            setError(err.message)
        }
    }

    return (<>
        <Container className="py-5">
            {!servingTicket ? (
                <>
                    <h1 className="text-center mb-3">Call the next customer to be served at cash number {cashierId}</h1>

                    {error && (
                        <Alert variant="danger" className="text-center">
                            {error}
                        </Alert>
                    )}

                    <Container className="d-flex justify-content-center align-items-center vh-100">
                        <Row className="justify-content-center">
                            <Button onClick={CallNextCustomer} size='lg'>
                                Call next customer
                            </Button>
                        </Row>
                    </Container>
                </>

            ) : (
                <Container className="d-flex justify-content-center align-items-center vh-100">
                    <Row className="justify-content-center w-100" style={{ marginTop: '-50px' }}>
                        <Col xs={12} md={8} className="text-center">
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
                </Container>

            )}
        </Container>
    </>)
}

export default CashierPage

