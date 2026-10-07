function Service(sId, name, tag, service_time){
    this.sId = sId,
    this.name = name,
    this.tag = tag,
    this.service_time = service_time
}

function Ticket(tId, code, issuedAt) {
  this.tId = tId;
  this.code = code;
  this.issuedAt = issuedAt;
}

function Queue(sId, serviceName, serviceTime, tickets = []) {
  this.sId = sId;
  this.serviceName = serviceName;
  this.serviceTime = serviceTime;
  this.tickets = tickets;
}

export {Service, Ticket, Queue};