// app/components/UploadForm.tsx
"use client";
import React, { useState } from 'react';
import { Button, TextField, Typography, Box, CircularProgress, Alert, Card, CardContent } from '@mui/material';

const UploadForm = () => {
  const [file, setFile] = useState<any>();
  const [text, setText] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: any) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleTextChange = (e: any) => {
    setText(e.target.value);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsUploading(true);
    if (!file) {
      alert('Please select a file to upload.');
      setIsUploading(false);
      return;
    }

    try {
      const response = await fetch(`/api/getPresignedUrl?fileName=${encodeURIComponent(file.name)}`, { method: 'GET' });
      const { url } = await response.json();

      const uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (uploadResponse.ok) {
        setUploadStatus('File uploaded successfully!');
        const dataToStore = {
          input_text: text,
          input_file: `${file.name}`
        };
        const storeResponse = await fetch('/api/storeData', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToStore),
        });

        const storeResult = await storeResponse.json();
        if (storeResponse.ok) {
          setUploadStatus(`File and text data stored successfully. DynamoDB ID: ${storeResult.itemId}`);
        } else {
          throw new Error('Data storing failed');
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setUploadStatus('An error occurred while uploading the file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Upload File
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Typography variant="h6">Text input:</Typography>
          <TextField
            margin="normal"
            required
            fullWidth
            id="textInput"
            label="Text Input"
            name="text"
            autoComplete="text"
            autoFocus
            value={text}
            onChange={handleTextChange}
          />
          <input
            type="file"
            onChange={handleFileChange}
            style={{ display: 'block', marginTop: '20px' }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isUploading}
          >
            {isUploading ? <CircularProgress size={24} /> : 'Upload to S3 and Store Data'}
          </Button>
          {uploadStatus && (
            <Alert severity={uploadStatus.includes('Error') ? 'error' : 'success'}>{uploadStatus}</Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default UploadForm;