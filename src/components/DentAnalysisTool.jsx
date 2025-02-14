import React, { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Square, AlertCircle, X } from 'lucide-react';

const DentLabelingTool = () => {
  const [imageUrl, setImageUrl] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [labels, setLabels] = useState([]);
  const [error, setError] = useState(null);
  const [imageName, setImageName] = useState('');
  const [validationMessages, setValidationMessages] = useState([]);
  
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const imageRef = useRef(null);

  // Dent size categories
  const dentSizes = [
    { id: 'dime', label: 'Dime Size', diameter: '17.91mm' },
    { id: 'nickel', label: 'Nickel Size', diameter: '21.21mm' },
    { id: 'quarter', label: 'Quarter Size', diameter: '24.26mm' },
    { id: 'halfDollar', label: 'Half Dollar', diameter: '30.61mm' },
    { id: 'brokenGlass', label: 'Broken Glass', diameter: 'Varied' }
  ];

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      const context = canvas.getContext('2d');
      context.strokeStyle = '#2563eb';
      context.lineWidth = 2;
      contextRef.current = context;
    }
  }, []);

  const validateImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 800 || img.height < 600) {
          reject('Image must be at least 800x600 pixels');
          return;
        }
        resolve(img);
      };
      img.onerror = () => reject('Failed to load image');
      img.src = URL.createObjectURL(file);
    });
  };

  const validateLabels = () => {
    const messages = [];
    
    // Check if there are any labels
    if (labels.length === 0) {
      messages.push('No dents have been labeled yet');
    }

    // Check for overlapping labels
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        if (checkOverlap(labels[i].points, labels[j].points)) {
          messages.push(`Labels ${i + 1} and ${j + 1} may be overlapping`);
        }
      }
    }

    // Check dent size distribution
    const sizeCount = labels.reduce((acc, label) => {
      acc[label.dentSize] = (acc[label.dentSize] || 0) + 1;
      return acc;
    }, {});
    
    if (Object.keys(sizeCount).length === 1 && labels.length > 3) {
      messages.push('All dents are marked as the same size. Please verify this is correct.');
    }

    setValidationMessages(messages);
    return messages.length === 0;
  };

  const exportLabels = () => {
    if (!validateLabels()) {
      return;
    }

    const exportData = {
      imageName,
      imageUrl,
      imageSize: {
        width: imageRef.current?.width || 0,
        height: imageRef.current?.height || 0
      },
      labels: labels.map((label, index) => ({
        id: index + 1,
        dentSize: label.dentSize,
        coordinates: label.points,
        timestamp: label.timestamp
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${imageName.replace(/\.[^/.]+$/, '')}_labels.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const checkOverlap = (points1, points2) => {
    // Simple bounding box overlap check
    const bbox1 = getBoundingBox(points1);
    const bbox2 = getBoundingBox(points2);
    
    return !(bbox1.maxX < bbox2.minX || 
             bbox1.minX > bbox2.maxX || 
             bbox1.maxY < bbox2.minY || 
             bbox1.minY > bbox2.maxY);
  };

  const getBoundingBox = (points) => {
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }
    setImageName(file.name);

    try {
      setError(null);
      const img = await validateImage(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      imageRef.current = img;
      
      const canvas = canvasRef.current;
      const context = contextRef.current;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    } catch (err) {
      setError(err.toString());
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload({ target: { files: [file] } });
    }
  };

  const startDrawing = ({ nativeEvent }) => {
    if (!imageUrl) return;
    
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    setCurrentPath([[offsetX, offsetY]]);
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    
    const { offsetX, offsetY } = nativeEvent;
    setCurrentPath(prev => [...prev, [offsetX, offsetY]]);
    
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const finishDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    contextRef.current.closePath();
    
    if (currentPath.length > 2) {
      setLabels(prev => [...prev, {
        points: currentPath,
        dentSize: document.getElementById('dentSize').value,
        timestamp: new Date().toISOString()
      }]);
    }
    
    setCurrentPath([]);
  };

  const deleteLabel = (index) => {
    setLabels(prev => prev.filter((_, i) => i !== index));
    // Redraw canvas
    const canvas = canvasRef.current;
    const context = contextRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (imageRef.current) {
      context.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    }
    // Redraw remaining labels
    labels.forEach((label, i) => {
      if (i !== index) {
        context.beginPath();
        context.moveTo(label.points[0][0], label.points[0][1]);
        label.points.forEach(([x, y]) => context.lineTo(x, y));
        context.closePath();
        context.stroke();
      }
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b p-4">
          <h2 className="text-xl font-bold text-gray-900">
            Dent Labeling Tool
          </h2>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {/* Tools Panel */}
            <div className="w-48 bg-gray-50 rounded-lg p-4">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dent Size
                </label>
                <select 
                  id="dentSize"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {dentSizes.map(size => (
                    <option key={size.id} value={size.id}>
                      {size.label} ({size.diameter})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-700 mb-2">Labels</h3>
                {labels.map((label, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm group">
                    <span className="text-sm text-gray-600">
                      {dentSizes.find(s => s.id === label.dentSize)?.label || label.dentSize}
                    </span>
                    <button 
                      onClick={() => deleteLabel(index)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {validationMessages.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-1">Validation Messages:</h4>
                  <ul className="list-disc pl-4 text-sm text-yellow-700">
                    {validationMessages.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={exportLabels}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Export Labels
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1">
              <div 
                className="bg-gray-100 rounded-lg relative"
                style={{ height: '600px' }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full rounded-lg"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={finishDrawing}
                  onMouseLeave={finishDrawing}
                />
                
                {!imageUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <label className="cursor-pointer text-gray-500 flex flex-col items-center bg-white p-8 rounded-lg shadow-sm">
                      <Upload className="w-12 h-12 mb-2" />
                      <p className="text-center">
                        Drop image here or click to upload
                        <br />
                        <span className="text-sm text-gray-400">
                          Minimum resolution: 800x600px
                        </span>
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DentLabelingTool;