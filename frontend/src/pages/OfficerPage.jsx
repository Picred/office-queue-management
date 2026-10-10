import { Button, Card, Container } from "react-bootstrap";

// Page for the logged in officers: for now it only shows who is logged in
// (the "Next customer" button will be added here)
function OfficerPage({ user, onLogout }) {
    return (
        <Container className="py-5">
            <Card className="mx-auto text-center" style={{ maxWidth: '500px' }}>
                <Card.Body className="p-5">
                    <h1 className="mb-3">Welcome, {user.username}</h1>

                    <p className="text-secondary mb-4">
                        Logged in as {user.role}
                    </p>

                    <Button variant="outline-primary" onClick={onLogout}>
                        Logout
                    </Button>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default OfficerPage;
