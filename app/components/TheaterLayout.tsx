"use client";
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Paper,
	Snackbar,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { Seat as SeatDbProps } from "@prisma/client";
import { useEffect, useState } from "react";
import { sectionConfig } from "../config/sectionConfig";

type SSEMessage = {
	type: "SEAT_UPDATE";
	seat: {
		section: string;
		row: string;
		number: number;
		block: string;
		name: string | null;
	};
};

type SeatProps = {
	row: string;
	number: number;
	section: string;
	block: string;
	occupied: string;
	onSeatClick: (row: string, number: number, section: string, block: string) => void;
};

type SelectedSeat = {
	row: string;
	number: number;
	section: string;
	block: string;
};

const Seat = ({ row, number, section, block, occupied, onSeatClick }: SeatProps) => {
	return (
		<Tooltip title={occupied || "Available"}>
			<Box
				component="button"
				sx={{
					width: 16,
					height: 16,
					borderRadius: "50%",
					border: "1px solid #666",
					backgroundColor: occupied ? "#FFA500" : "#90EE90",
					m: 0.25,
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					p: 0,
					"&:hover": {
						opacity: 0.8,
					},
				}}
				onClick={() => onSeatClick(row, number, section, block)}>
				<Typography variant="caption" sx={{ fontSize: "6px", lineHeight: 1 }}>
					{number}
				</Typography>
			</Box>
		</Tooltip>
	);
};

type SeatBlockProps = {
	block: {
		seatsPerRow: number | Record<string, number>;
	};
	row: string;
	section: string;
	blockType: string;
	startNumber: number;
	occupiedSeats: Record<string, string>;
	onSeatClick: (row: string, number: number, section: string, block: string) => void;
	align?: string;
	width?: string;
};

const SeatBlock = ({
	block,
	row,
	section,
	blockType,
	startNumber,
	occupiedSeats,
	onSeatClick,
	align,
	width,
}: SeatBlockProps) => {
	if (!block) return null;
	const seatsCount =
		typeof sectionConfig[section].blocks[blockType].seatsPerRow === "object"
			? sectionConfig[section].blocks[blockType].seatsPerRow[row]
			: sectionConfig[section].blocks[blockType].seatsPerRow;

	return (
		<Box sx={{ display: "flex", flexWrap: "nowrap", width: width, justifyContent: align || "center" }}>
			{[...Array(seatsCount)].map((_, idx) => (
				<Seat
					key={`${section}-${blockType}-${row}-${startNumber + idx}`}
					row={row}
					number={startNumber + idx}
					section={section}
					block={blockType}
					occupied={occupiedSeats[`${section}-${row}-${startNumber + idx}-${blockType}`]}
					onSeatClick={onSeatClick}
				/>
			))}
		</Box>
	);
};

type SeatRowProps = {
	row: string;
	section: string;
	occupiedSeats: Record<string, string>;
	onSeatClick: (row: string, number: number, section: string, block: string) => void;
};

const SeatRow = ({ row, section, occupiedSeats, onSeatClick }: SeatRowProps) => {
	// Calculate starting numbers for each block
	const leftSeats =
		typeof sectionConfig[section].blocks.left.seatsPerRow === "object"
			? sectionConfig[section].blocks.left.seatsPerRow[row]
			: sectionConfig[section].blocks.left.seatsPerRow;

	const centerSeats =
		typeof sectionConfig[section].blocks.center.seatsPerRow === "object"
			? sectionConfig[section].blocks.center.seatsPerRow[row]
			: sectionConfig[section].blocks.center.seatsPerRow;

	const secondCenterSeats =
		typeof sectionConfig[section].blocks.centeragain?.seatsPerRow === "object"
			? sectionConfig[section].blocks.centeragain.seatsPerRow[row]
			: 0;

	const centerStart = leftSeats + 1;
	const secondCenterStart = centerStart + centerSeats;
	const rightStart = centerStart + centerSeats + secondCenterSeats;

	let centerWidthOne = "33%";
	let centerWidthTwo = "0%";
	if (secondCenterSeats > 0) {
		centerWidthOne = "16%";
		centerWidthTwo = "16%";
	}

	return (
		<Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
			<Typography sx={{ width: 20, mr: 1, fontSize: "0.75rem" }}>{row}</Typography>
			<Box sx={{ display: "flex", gap: 2, flex: 1, justifyContent: "space-between" }}>
				<SeatBlock
					block={sectionConfig[section].blocks.left}
					row={row}
					section={section}
					blockType="left"
					startNumber={1}
					occupiedSeats={occupiedSeats}
					onSeatClick={onSeatClick}
					align="flex-end"
					width="33%"
				/>
				<SeatBlock
					block={sectionConfig[section].blocks.center}
					row={row}
					section={section}
					blockType="center"
					startNumber={centerStart}
					occupiedSeats={occupiedSeats}
					onSeatClick={onSeatClick}
					align={secondCenterSeats > 0 ? "flex-end" : "center"}
					width={centerWidthOne}
				/>
				<SeatBlock
					block={sectionConfig[section].blocks.centeragain}
					row={row}
					section={section}
					blockType="centeragain"
					startNumber={secondCenterStart}
					occupiedSeats={occupiedSeats}
					onSeatClick={onSeatClick}
					align="flex-start"
					width={centerWidthTwo}
				/>
				<SeatBlock
					block={sectionConfig[section].blocks.right}
					row={row}
					section={section}
					blockType="right"
					startNumber={rightStart}
					occupiedSeats={occupiedSeats}
					onSeatClick={onSeatClick}
					align="flex-start"
					width="33%"
				/>
			</Box>
			<Typography sx={{ width: 20, ml: 1, fontSize: "0.75rem" }}>{row}</Typography>
		</Box>
	);
};
type SectionProps = {
	title: string;
	config: {
		rows: string[];
		blocks: {
			[key: string]: {
				seatsPerRow: {
					[key: string]: number;
				};
			};
		};
	};
	occupiedSeats: Record<string, string>;
	onSeatClick: (row: string, number: number, section: string, block: string) => void;
};
const Section = ({ title, config, occupiedSeats, onSeatClick }: SectionProps) => {
	return (
		<Box sx={{ mb: 4 }}>
			<Typography
				variant="h6"
				sx={{
					mb: 2,
					color: title === "Gold" ? "#DAA520" : title === "Silver" ? "#C0C0C0" : "#CD7F32",
					fontSize: "1rem",
				}}>
				{title} {title === "Gold" ? "724" : title === "Silver" ? "570" : "323"} seats
			</Typography>
			{config.rows.map(row => (
				<SeatRow
					key={`${title}-${row}`}
					row={row}
					section={title.toLowerCase()}
					occupiedSeats={occupiedSeats}
					onSeatClick={onSeatClick}
				/>
			))}
		</Box>
	);
};

const TheaterLayout = () => {
	const [occupiedSeats, setOccupiedSeats] = useState<Record<string, string>>({});
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedSeat, setSelectedSeat] = useState<SelectedSeat | null>(null);
	const [name, setName] = useState("");
	const [snackbar, setSnackbar] = useState<{
		message: string;
		severity: "success" | "error" | "info" | "warning";
	} | null>(null);
	const [, setPendingUpdates] = useState<{ [key: string]: string }>({});

	const fetchOccupiedSeats = async () => {
		try {
			const response = await fetch("/api/seats");
			const data = await response.json();
			const occupied: Record<string, string> = {};
			data.forEach((seat: SeatDbProps) => {
				occupied[`${seat.section}-${seat.row}-${seat.number}-${seat.block}`] = seat.name || "";
			});
			setOccupiedSeats(occupied);
		} catch (error) {
			console.error("Error fetching seats:", error);
		}
	};

	const handleSeatClick = (row: string, number: number, section: string, block: string) => {
		setSelectedSeat({ row, number, section, block });
		setName(occupiedSeats[`${section}-${row}-${number}-${block}`] || "");
		setDialogOpen(true);
	};

	const handleSave = async () => {
		if (!selectedSeat) {
			setSnackbar({
				message: "Invalid seat selection",
				severity: "error",
			});
			return;
		}

		try {
			const requestBody = {
				row: selectedSeat.row,
				number: selectedSeat.number,
				section: selectedSeat.section,
				block: selectedSeat.block,
				name: name || null,
			};

			const response = await fetch("/api/seats", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				throw new Error("Failed to save seat");
			}

			setDialogOpen(false);
		} catch (error) {
			setSnackbar({
				message: error instanceof Error ? error.message : "Error saving seat",
				severity: "error",
			});
		}
	};

	useEffect(() => {
		fetchOccupiedSeats();
	}, []);

	// Add SSE connection
	useEffect(() => {
		let retryTimeout: NodeJS.Timeout;

		const connectSSE = () => {
			try {
				const sse = new EventSource("/api/seats/updates");

				sse.onopen = () => {
					console.log("SSE connection opened");
					// Refresh data when connection is established
					fetchOccupiedSeats();
				};

				sse.onmessage = event => {
					try {
						if (event.data === "keepalive") return;

						const data = JSON.parse(event.data) as SSEMessage;
						if (data.type === "SEAT_UPDATE" && data.seat) {
							const updatedSeat = data.seat;
							const key = `${updatedSeat.section}-${updatedSeat.row}-${updatedSeat.number}-${updatedSeat.block}`;

							setOccupiedSeats(prev => {
								const next = { ...prev };
								if (updatedSeat.name) {
									next[key] = updatedSeat.name;
								} else {
									delete next[key];
								}
								return next;
							});

							// Clear any pending updates for this seat
							setPendingUpdates(prev => {
								const next = { ...prev };
								delete next[key];
								return next;
							});

							if (!updatedSeat.name) {
								// If name is null, it means the seat was cleared
								setSnackbar({
									message: `Seat ${updatedSeat.row}-${updatedSeat.number} was cleared`,
									severity: "info",
								});
							} else {
								setSnackbar({
									message: `Seat ${updatedSeat.row}-${updatedSeat.number} was updated`,
									severity: "info",
								});
							}
						}
					} catch (error) {
						console.error("Error processing SSE message:", error);
					}
				};

				sse.onerror = error => {
					console.error("SSE Error:", error);
					sse.close();
					// Try to reconnect after a delay
					retryTimeout = setTimeout(connectSSE, 5000);
				};

				return sse;
			} catch (error) {
				console.error("Error creating SSE connection:", error);
				retryTimeout = setTimeout(connectSSE, 5000);
				return null;
			}
		};

		const sse = connectSSE();

		return () => {
			if (sse) {
				sse.close();
			}
			if (retryTimeout) {
				clearTimeout(retryTimeout);
			}
		};
	}, []);
	return (
		<>
			<Box sx={{ p: 1 }}>
				<Box sx={{ mb: 4, textAlign: "center" }}>
					<Paper
						elevation={1}
						sx={{
							width: "80%",
							mx: "auto",
							p: 1,
							border: "1px solid black",
						}}>
						<Typography variant="h6">Stage</Typography>
					</Paper>
				</Box>

				<Section title="Gold" config={sectionConfig.gold} occupiedSeats={occupiedSeats} onSeatClick={handleSeatClick} />

				<Section
					title="Silver"
					config={sectionConfig.silver}
					occupiedSeats={occupiedSeats}
					onSeatClick={handleSeatClick}
				/>

				<Box sx={{ textAlign: "center", my: 2 }}>
					<Box sx={{ display: "inline-flex", gap: 4 }}>
						<Paper elevation={1} sx={{ p: 1, minWidth: 100 }}>
							<Typography>CONTROL AREA</Typography>
						</Paper>
						<Paper elevation={1} sx={{ p: 1, minWidth: 100 }}>
							<Typography>SOUND MIXER</Typography>
						</Paper>
					</Box>
				</Box>

				<Typography sx={{ textAlign: "center", my: 2 }}>Next Level</Typography>

				<Section
					title="Bronze"
					config={sectionConfig.bronze}
					occupiedSeats={occupiedSeats}
					onSeatClick={handleSeatClick}
				/>

				<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
					<DialogTitle>
						Edit Seat {selectedSeat?.row}-{selectedSeat?.number}
					</DialogTitle>
					<DialogContent>
						<TextField
							autoFocus
							margin="dense"
							label="Name"
							fullWidth
							value={name}
							onChange={e => setName(e.target.value)}
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setDialogOpen(false)}>Cancel</Button>
						<Button onClick={handleSave} variant="contained">
							Save
						</Button>
					</DialogActions>
				</Dialog>
			</Box>
			<Snackbar
				open={!!snackbar}
				autoHideDuration={3000}
				onClose={() => setSnackbar(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
				<Alert onClose={() => setSnackbar(null)} severity={snackbar?.severity} sx={{ width: "100%" }}>
					{snackbar?.message}
				</Alert>
			</Snackbar>
		</>
	);
};

export default TheaterLayout;
