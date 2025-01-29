type SectionConfig = {
  [key: string]: {
    rows: string[];
    blocks: {
      [key: string]: {
        seatsPerRow: {
          [key: string]: number;
        };
      };
    };
  };
};

export const sectionConfig: SectionConfig = {
  gold: {
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
    blocks: {
      left: {
        seatsPerRow: {
          A: 15, B: 15, C: 16, D: 21, E: 22, F: 22,
          G: 23, H: 23, I: 23, J: 23, K: 23, L: 23
        }
      },
      center: {
        seatsPerRow: {
          A: 12, B: 12, C: 14, D: 16, E: 18, F: 18,
          G: 20, H: 21, I: 22, J: 22, K: 22, L: 23
        }
      },
      right: {
        seatsPerRow: {
          A: 16, B: 16, C: 16, D: 23, E: 23, F: 23,
          G: 23, H: 23, I: 23, J: 23, K: 23, L: 23
        }
      }
    }
  },
  silver: {
    rows: ['M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
    blocks: {
      left: { 
        seatsPerRow: {
          M: 21, N: 21, O: 20, P: 18, Q: 16, R: 15,
          S: 13, T: 11, U: 8, V: 6, W: 3
        }
      },
      center: { 
        seatsPerRow: {
          M: 11, N: 12, O: 12, P: 12, Q: 13, R: 13,
          S: 14, T: 14, U: 14, V: 14, W: 6
        }
      },
      centeragain: { 
        seatsPerRow: {
          M: 11, N: 12, O: 12, P: 12, Q: 13, R: 13,
          S: 14, T: 14, U: 14, V: 14, W: 0
        }
      },
      right: { 
        seatsPerRow: {
          M: 20, N: 20, O: 20, P: 20, Q: 18, R: 16,
          S: 14, T: 12, U: 8, V: 6, W: 5
        }
      }
    }
  },
  bronze: {
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    blocks: {
      left: { 
        seatsPerRow: {
          A: 15, B: 14, C: 13, D: 12, E: 11, F: 8, G: 8
        }
      },
      center: { 
        seatsPerRow: {
          A: 25, B: 25, C: 25, D: 25, E: 25, F: 22, G: 14
        }
      },
      right: { 
        seatsPerRow: {
          A: 15, B: 14, C: 13, D: 12, E: 11, F: 8, G: 8
        }
      }
    }
  }
};
