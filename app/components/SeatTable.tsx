"use client";

import { Box, CircularProgress } from "@mui/material";
import { Suspense } from "react";
import SeatTableContent from "./SeatTableContent";

const TableLoader = () => (
	<Box
		sx={{
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			minHeight: "400px",
		}}>
		<CircularProgress />
	</Box>
);

const SeatTable = () => {
	return (
		<Suspense fallback={<TableLoader />}>
			<SeatTableContent />
		</Suspense>
	);
};

export default SeatTable;
