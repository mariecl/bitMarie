/*
* This module will create the client connections to peers and manage the handshake protocol
*/

/*
* @id @ip @port: information about the peer provided by the tracker
*/
function Peer (id, ip, port) {
	this.id = id;
	this.ip = ip;
	this.port = port;
}

module.exports = Peer;