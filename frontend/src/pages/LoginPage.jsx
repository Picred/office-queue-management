import { Form, Button, Stack, Card, Spinner, Container, Row, Col } from "react-bootstrap";
import { useState } from "react";

/**
 * [Renders a login form.]
 * @returns the login form in order to log into the account.
 */
export const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState("");


    const handlesubmit = async (event) => {
        event.preventDefault();

        setIsLoading(true);
        setNotification("");

        // const user_data = await API.login({ email: email, password: password })

        // if (user_data.error) {
        //     setNotification(user_data.error)
        //     set_is_loading(false);
        //     return;
        // }

        // set_user(user_data) // email: email

        // navigate("/");

        setTimeout(() => {
            setEmail("");
            setPassword("");
            setIsLoading(false);
        }, 2000);
    }


    return (
        <Container className="min-vh-100 d-flex align-items-center justify-content-center">
            <Row className="w-100 justify-content-center">
                <Col xs={12} sm={8} md={6} lg={4}>
                    <Card className="p-4 shadow-sm">
                        <Card.Body>
                            <h3 className="text-center fw-bold">Login!</h3>

                            {notification && <p className="rounded p-1 my-4 border text-center fs-5 text- bg-body-secondary">{notification}!</p>}

                            <p>Provide your credentials!</p>

                            <Form onSubmit={(event) => handlesubmit(event)}>

                                <Form.Group className="mb-3" controlId="formGroupEmail">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        minLength={3}
                                        maxLength={50}
                                        placeholder="name@email.com"
                                        value={email}
                                        onChange={event => setEmail(event.target.value)}
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