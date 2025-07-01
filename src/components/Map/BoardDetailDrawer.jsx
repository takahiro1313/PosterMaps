import React from 'react';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';

export default function BoardDetailDrawer({ open, onClose, markerGroup }) {
  if (!markerGroup) return null;
  const [lat, lng] = [markerGroup[0].lat, markerGroup[0].lng];
  const getFormUrl = (areaNumber) =>
    `${GOOGLE_FORM_BASE_URL}?usp=pp_url&${LOCATION_ENTRY_ID}=${encodeURIComponent(areaNumber)}`;
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400, md: 440 }, p: 2 }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold', fontSize: 18 }}>掲示板詳細</div>
        <IconButton onClick={onClose} size="large">
          <CloseIcon />
        </IconButton>
      </div>
      {markerGroup.length > 1 && (
        <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#c00' }}>
          この場所には複数の掲示板があります
        </div>
      )}
      {markerGroup.map((marker, idx) => (
        <div key={marker.areaNumber} style={{ borderBottom: idx < markerGroup.length-1 ? '1px solid #eee' : 'none', marginBottom: 12, paddingBottom: 12 }}>
          <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{marker.place || marker.name}</div>
          <div style={{ fontSize: 13, marginBottom: 2 }}><strong>投票区番号:</strong> {marker.areaNumber}</div>
          <div style={{ fontSize: 13, marginBottom: 2 }}><strong>ステータス:</strong> {marker.statusText}</div>
          <div style={{ fontSize: 13, marginBottom: 2 }}><strong>住所:</strong> {marker.address}</div>
          <div style={{ fontSize: 13, marginBottom: 2 }}><strong>備考:</strong> {marker.note}</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>座標: {marker.lat?.toFixed(4)}, {marker.lng?.toFixed(4)}</div>
          <Button
            variant="contained"
            color="primary"
            href={getFormUrl(marker.areaNumber)}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<span role="img" aria-label="form">📝</span>}
            sx={{ mt: 1 }}
            fullWidth
          >
            フォームに報告
          </Button>
        </div>
      ))}
    </Drawer>
  );
} 