# office-queue-management

## General Structure
- Architecture: client - server
- Backend: Node.js
- Frontend: React
- Database: relational (sqlite)
- Synchronization: WebSocket
- Authentication: Passport
  
## Database Tables
- `services` contains sId, name (text), tag (text), service_time (integer)
- `counters` contains cId, name (text)
- `counter_services` contains cId, sId
- `tickets` contains tId, code (text), sId, issued_at (text), status (text), served_at (text), cId
- `users` contains uId, username (text), password_hash (text), salt (text), role (text), cId
