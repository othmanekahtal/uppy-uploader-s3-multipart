import React, { useState } from 'react';
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import AwsS3 from '@uppy/aws-s3';

function onUploadComplete(result: any) {
  console.log(
    'Upload complete! We’ve uploaded these files:',
    result.successful
  );
}
function onUploadSuccess(file: any, data: any) {
  console.log('Upload success! We’ve uploaded this file:', file.meta['name']);
}
export default function App() {
  // keeping the uppy instance alive above the pages the user can switch during uploading
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: [
          'application/zip',
          'application/octet-stream',
          'application/x-zip-compressed',
          'multipart/x-zip',
        ],
      },
    }).use(AwsS3, {
      endpoint: 'http://localhost:3000/api',
      shouldUseMultipart: true,
    })
  );
  uppy.on('file-added', (file) => {
    console.log('file-added', file.meta);
    uppy.setMeta({
      ...uppy.getState().meta,
      // add your meta data here
      courseName: 'zzzcourse',
    });
  });
  uppy.on('complete', onUploadComplete);
  uppy.on('upload-success', onUploadSuccess);
  return (
    <Dashboard
      hideCancelButton={false}
      hidePauseResumeButton={false}
      uppy={uppy}
      fileManagerSelectionType="files"
    />
  );
}
