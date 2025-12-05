import { useState, useRef } from 'react';

export function FileUpload({ name = 'pdf' }: { name?: string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
          relative flex flex-col items-center justify-center
          w-full border-2 border-dashed rounded-lg
          cursor-pointer p-4 sm:p-6 md:p-8
          ${
            isDragging
              ? 'border-cyan-400 bg-cyan-400/10'
              : selectedFile
                ? 'border-cyan-400/50 bg-gray-800/50 hover:border-cyan-400 hover:bg-gray-800/70'
                : 'border-gray-600 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-800/50'
          }
        `}
    >
      <input
        ref={fileInputRef}
        type="file"
        name={name}
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {selectedFile ? (
        <div className="flex flex-col items-center gap-2 sm:gap-3 w-full">
          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-700/50 rounded-lg w-full max-w-md">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-xs sm:text-sm truncate">
                {selectedFile.name}
              </p>
              <p className="text-gray-400 text-xs">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="ml-2 p-1 sm:p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
              aria-label="Remove file"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm">Haz click o arrastra para reemplazar</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
          <svg
            className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 transition-colors ${
              isDragging ? 'text-cyan-400' : 'text-gray-500'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p
            className={`text-base sm:text-lg md:text-xl font-medium transition-colors text-center px-2 ${
              isDragging ? 'text-cyan-400' : 'text-white'
            }`}
          >
            {isDragging ? 'Suelta tu PDF aquí' : 'Arrastra y suelta tu PDF'}
          </p>
          <p className="text-gray-400 text-sm">ó</p>
          <button
            type="button"
            className="px-4 py-2 bg-cyan-400 text-gray-900 font-semibold rounded-lg text-sm hover:opacity-80"
          >
            Explorar archivos
          </button>
          <p className="text-gray-500 text-sm">Solo se aceptan PDFs</p>
        </div>
      )}
    </div>
  );
}
