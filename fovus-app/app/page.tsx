// app/page.tsx
import React from 'react';
import UploadForm from './components/UploadForm';
import { Container, CssBaseline } from '@mui/material';

export default function HomePage() {
  return (
    <Container component="main" maxWidth="sm" sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 1,
      padding: 3,
      boxShadow: 1
    }}>
      <CssBaseline />
      <UploadForm />
    </Container>
  );
}