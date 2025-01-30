'use client';

import { Clear as ClearIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { sectionConfig } from '../config/sectionConfig';

interface Seat {
  section: string;
  row: string;
  number: number;
  block: string;
  name: string | null;
}

interface Filters {
  section: string;
  row: string;
  block: string;
  occupancyStatus: string;
}
interface SnackbarMessage {
  message: string;
  severity: 'success' | 'error';
}


const DEBOUNCE_DELAY = 1000; 

const getSectionColor = (section: string) => {
  switch (section.toLowerCase()) {
    case 'gold':
      return '#DAA520';
    case 'silver':
      return '#C0C0C0';
    case 'bronze':
      return '#CD7F32';
    default:
      return 'inherit';
  }
};

const generateAllSeats = () => {
  const allSeats: Seat[] = [];

  Object.entries(sectionConfig).forEach(([section, config]) => {
    config.rows.forEach((row) => {
      let seatCounter = 1;
      Object.entries(config.blocks).forEach(([block, blockConfig]) => {
        const seatCount = blockConfig.seatsPerRow[row];
        for (let i = 0; i < seatCount; i++) {
          allSeats.push({
            section,
            row,
            number: seatCounter++,
            block,
            name: null
          });
        }
      });
    });
  });

  return allSeats.sort((a, b) => {
    if (a.section !== b.section) return a.section.localeCompare(b.section);
    if (a.row !== b.row) return a.row.localeCompare(b.row);
    if (a.block !== b.block) return a.block.localeCompare(b.block);
    return a.number - b.number;
  });
};

const getAllUniqueValues = (seats: Seat[]) => {
  const sections = new Set(seats.map(seat => seat.section));
  const rows = new Set(seats.map(seat => seat.row));
  const blocks = new Set(seats.map(seat => seat.block));

  return {
    sections: Array.from(sections),
    rows: Array.from(rows).sort(),
    blocks: Array.from(blocks),
  };
};

const SeatTable = () => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [filteredSeats, setFilteredSeats] = useState<Seat[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [occupiedSeats, setOccupiedSeats] = useState<{[key: string]: string}>({});
  const [pendingUpdates, setPendingUpdates] = useState<{[key: string]: string}>({});
  const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);

  const [filters, setFilters] = useState<Filters>({
    section: '',
    row: '',
    block: '',
    occupancyStatus: '',
  });
  const [uniqueValues, setUniqueValues] = useState<{ sections: string[], rows: string[], blocks: string[] }>({
    sections: [],
    rows: [],
    blocks: [],
  });


  const applyFilters = useCallback(() => {
    let filtered = [...seats];

    if (filters.section) {
      filtered = filtered.filter(seat => seat.section.toLowerCase() === filters.section.toLowerCase());
    }
    if (filters.row) {
      filtered = filtered.filter(seat => seat.row === filters.row);
    }
    if (filters.block) {
      filtered = filtered.filter(seat => seat.block === filters.block);
    }
    if (filters.occupancyStatus) {
      const isOccupied = filters.occupancyStatus === 'occupied';
      filtered = filtered.filter(seat => {
        const key = `${seat.section}-${seat.row}-${seat.number}-${seat.block}`;
        return isOccupied ? key in occupiedSeats : !(key in occupiedSeats);
      });
    }

    setFilteredSeats(filtered);
    setPage(0);
  }, [filters, occupiedSeats, seats]);

  const fetchOccupiedSeats = async () => {
    try {
      const response = await fetch('/api/seats');
      const data = await response.json();
      const finalData = data.filter((seat: Seat) => seat.name !== null);
      const occupied: {[key: string]: string} = {};
      finalData.forEach((seat: Seat) => {
          occupied[`${seat.section}-${seat.row}-${seat.number}-${seat.block}`] = seat.name || '';
        });
      setOccupiedSeats(occupied);
    } catch (error) {
      console.error('Error fetching seats:', error);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const debouncedApiCall = useCallback(debounce(async (seat: Seat, newName: string) => {
      try {
        const response = await fetch('/api/seats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...seat,
            name: newName || null,
          }),
        });

        
        if (!response.ok) {
          throw new Error('Failed to update seat');
        }

        setSnackbar({
          message: `Successfully ${newName ? 'assigned' : 'removed'} name for seat ${seat.row}-${seat.number}`,
          severity: 'success'
        });

        const key = `${seat.section}-${seat.row}-${seat.number}-${seat.block}`;
        setOccupiedSeats(prev => ({
          ...prev,
          [key]: newName
        }));
        
        // Clear pending update after successful API call
        setPendingUpdates(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } catch (error) {
        console.error('Error updating seat:', error);
          setSnackbar({
            message: `Failed to update seat ${seat.row}-${seat.number}`,
            severity: 'error'
          });
        // Revert the pending update on error
        const key = `${seat.section}-${seat.row}-${seat.number}-${seat.block}`;
        setPendingUpdates(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setOccupiedSeats(prev => {
          const next = { ...prev };
          if (!newName) {
            delete next[key];
          }
          return next;
        });
      }
    }, DEBOUNCE_DELAY), []);

  const handleNameChange = async (seat: Seat, newName: string) => {
        const key = `${seat.section}-${seat.row}-${seat.number}-${seat.block}`;
        setPendingUpdates(prev => ({
            ...prev,
            [key]: newName
            }));
        debouncedApiCall(seat, newName);
    
  };

  const handleExport = () => {
    const exportData = filteredSeats.map(seat => ({
      Section: seat.section.toUpperCase(),
      Row: seat.row,
      Block: seat.block,
      'Seat Number': seat.number,
      Name: occupiedSeats[`${seat.section}-${seat.row}-${seat.number}-${seat.block}`] || '',
      Status: occupiedSeats[`${seat.section}-${seat.row}-${seat.number}-${seat.block}`] ? 'Occupied' : 'Empty'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Seats');
    XLSX.writeFile(wb, 'theater_seats.xlsx');
  };

  const clearFilters = () => {
    setFilters({
      section: '',
      row: '',
      block: '',
      occupancyStatus: '',
    });
  };

    useEffect(() => {
    const allPossibleSeats = generateAllSeats();
    setSeats(allPossibleSeats);
    setFilteredSeats(allPossibleSeats);
    setUniqueValues(getAllUniqueValues(allPossibleSeats));
    fetchOccupiedSeats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    return () => {
      debouncedApiCall.cancel();
    };
  }, [debouncedApiCall]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Seat Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
        >
          Export to Excel
        </Button>
      </Stack>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Section</InputLabel>
            <Select
              value={filters.section}
              label="Section"
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueValues.sections.map((section) => (
                <MenuItem key={section} value={section}>{section.toUpperCase()}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Row</InputLabel>
            <Select
              value={filters.row}
              label="Row"
              onChange={(e) => setFilters({ ...filters, row: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueValues.rows.map((row) => (
                <MenuItem key={row} value={row}>{row}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Block</InputLabel>
            <Select
              value={filters.block}
              label="Block"
              onChange={(e) => setFilters({ ...filters, block: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueValues.blocks.map((block) => (
                <MenuItem key={block} value={block}>{block}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.occupancyStatus}
              label="Status"
              onChange={(e) => setFilters({ ...filters, occupancyStatus: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="occupied">Occupied</MenuItem>
              <MenuItem value="empty">Empty</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Clear filters">
            <IconButton onClick={clearFilters}>
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 700 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Section</TableCell>
                <TableCell>Row</TableCell>
                <TableCell>Seat</TableCell>
                <TableCell>Block</TableCell>
                <TableCell>Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSeats
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((seat) => {
                  const key = `${seat.section}-${seat.row}-${seat.number}-${seat.block}`;
                  const isOccupied = key in occupiedSeats;
                  
                  return (
                    <TableRow 
                      key={key}
                      sx={{
                        backgroundColor: isOccupied ? 'rgba(255, 165, 0, 0.1)' : 'transparent'
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ color: getSectionColor(seat.section), fontWeight: 'bold' }}>
                          {seat.section.toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>{seat.row}</TableCell>
                      <TableCell>{seat.number}</TableCell>
                      <TableCell>{seat.block}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                           value={
                                // Show pending value if exists, otherwise show occupied seat value
                                pendingUpdates[`${seat.section}-${seat.row}-${seat.number}-${seat.block}`] !== undefined
                                    ? pendingUpdates[`${seat.section}-${seat.row}-${seat.number}-${seat.block}`]
                                    : occupiedSeats[`${seat.section}-${seat.row}-${seat.number}-${seat.block}`] || ''
                                }
                          onChange={(e) => handleNameChange(seat, e.target.value)}
                          variant="standard"
                          placeholder="Empty"
                          sx={{
                            '& .MuiInput-input': {
                                padding: '4px 0'
                            },
                            // Optional: show visual feedback for pending updates
                            '& .MuiInput-root': {
                                '&:after': {
                                borderColor: pendingUpdates[`${seat.section}-${seat.row}-${seat.number}-${seat.block}`] !== undefined
                                    ? 'orange'
                                    : undefined
                                }
                            }
                            }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={filteredSeats.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      {snackbar &&
        <Snackbar
          open={!!snackbar}
          autoHideDuration={3000}
          onClose={() => setSnackbar(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar(null)} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      }
    </Box>
  );
};

export default SeatTable;