import { Form, Button, Stack, Card, Spinner, Container, Row, Col } from "react-bootstrap";
import { useState } from "react";
import { login } from "../API/api";

/**
 * [Renders a login form.]
 * @returns the login form in order to log into the account.
 */
export const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState("");


    const handlesubmit = async (event) => {
        event.preventDefault();

        setIsLoading(true);
        setNotification("");

        try {
            const user_data = await login({ username: username, password: password });

            onLogin(user_data);
        } catch (err) {
            setNotification(err.message);
            setPassword("");
            setIsLoading(false);
        }
    }


    return (
        <Container className="min-vh-100 d-flex align-items-center justify-content-center">
            <Row className="w-100 justify-content-center">
                <Col xs={12} sm={8} md={6} lg={4}>
                    <Card className="p-4 shadow-sm">
                        <Card.Body>
                            <h3 className="text-center fw-bold">Login!</h3>

                            {notification && <p className="rounded p-1 my-4 border text-center fs-5 text- bg-body-secondary">{notification}</p>}

                            <p>Provide your credentials!</p>

                            <Form onSubmit={(event) => handlesubmit(event)}>

                                <Form.Group className="mb-3" controlId="formGroupUsername">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        minLength={3}
                                        maxLength={50}
                                        placeholder="counter1"
                                        value={username}
                                        onChange={event => setUsername(event.target.value)}
                                        required />
                                </Form.Group>


                                <Form.Group className="mb-3" controlId="formGroupPassword">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        minLength={2}
                                        maxLength={30}
                                        placeholder="YourPassword"
                                        value={password}
                                        onChange={event => setPassword(event.target.value)}
                                        required />
                                </Form.Group>

                                <Stack direction="horizontal" className="justify-content-center">
                                    {!isLoading
                                        ?
                                        <Button className="btn-md btn-success" type="submit">Login</Button>
                                        :
                                        <Button className="btn-md btn-success disabled" type="submit">
                                            <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                            />
                                            <span className="px-2">Sending...</span>
                                        </Button>
                                    }
                                </Stack>

                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};