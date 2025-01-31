// app/lib/sse.ts
import { Seat } from "@prisma/client";
import { ReadableStreamDefaultController } from "stream/web";

const clients = new Set<ReadableStreamDefaultController>();

export function sendUpdateToClients(data: { type: "SEAT_UPDATE"; seat: Seat | null }) {
	const deadClients = new Set<ReadableStreamDefaultController>();

	clients.forEach(client => {
		try {
			const eventData = `data: ${JSON.stringify(data)}\n\n`;
			client.enqueue(new TextEncoder().encode(eventData));
		} catch (error) {
			console.error("Error sending to client:", error);
			deadClients.add(client);
		}
	});

	// Clean up dead clients
	deadClients.forEach(client => {
		clients.delete(client);
	});
}

export function addClient(controller: ReadableStreamDefaultController) {
	clients.add(controller);
	console.log("Client connected. Total clients:", clients.size);
}

export function removeClient(controller: ReadableStreamDefaultController) {
	clients.delete(controller);
	console.log("Client disconnected. Total clients:", clients.size);
}
