import { TableRow, TableCell, Skeleton } from "@mui/material";

export default function SkeletonRow() {
  return (
    <TableRow>
      <TableCell><Skeleton /></TableCell>
      <TableCell><Skeleton width={40} /></TableCell>
      <TableCell><Skeleton width="80%" /></TableCell>
      <TableCell><Skeleton width={120} /></TableCell>
      <TableCell align="right"><Skeleton width={60} /></TableCell>
    </TableRow>
  );
}

