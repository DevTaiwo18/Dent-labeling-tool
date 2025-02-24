import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, Upload, X, Filter, Download, Edit2, Save, Circle, Square, Info } from 'lucide-react';

const API_ENDPOINT = 'https://racial-ivette-jmccottry-c0386bc9.koyeb.app';

const DENT_CATEGORIES = {
    dime: { color: '#ef4444', label: 'Dime' },
    nickel: { color: '#a855f7', label: 'Nickel' },
    quarter: { color: '#3b82f6', label: 'Quarter' },
    half_dollar: { color: '#22c55e', label: 'Half Dollar' },
    oversized: { color: '#f59e0b', label: 'Oversize' }
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.2;

// Modal component for instructions
const InstructionModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Drawing Instructions</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
                        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-blue-700">Follow these steps to properly mark dents on your image.</p>
                    </div>
                    
                    <ol className="space-y-3 pl-5 list-decimal">
                        <li className="pl-2">
                            <span className="font-medium">Select a dent category</span>
                            <p className="text-gray-600 text-sm mt-1">Click on a category from the left panel to select the dent type you want to mark.</p>
                        </li>
                        <li className="pl-2">
                            <span className="font-medium">Click and drag on the image</span>
                            <p className="text-gray-600 text-sm mt-1">Click where you want to start the dent marking and drag to define its size.</p>
                        </li>
                        <li className="pl-2">
                            <span className="font-medium">Release to create the dent</span>
                            <p className="text-gray-600 text-sm mt-1">When you release the mouse button, the dent will be created and added to your analysis.</p>
                        </li>
                        <li className="pl-2">
                            <span className="font-medium">Add more as needed</span>
                            <p className="text-gray-600 text-sm mt-1">You can continue adding more dents or click on existing ones to see their details.</p>
                        </li>
                    </ol>
                    
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                        >
                            Proceed to Drawing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Drawing Canvas component for manual dent marking
const DrawingCanvas = ({ imageRef, scale, position, onAddDent, currentCategory }) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState(null);
    const canvasRef = useRef(null);
    
    const getCanvasCoordinates = (e) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - position.x) / scale,
            y: (e.clientY - rect.top - position.y) / scale
        };
    };
    
    const handleMouseDown = (e) => {
        if (!currentCategory) return;
        
        e.stopPropagation(); // Prevent parent container's drag
        setIsDrawing(true);
        const point = getCanvasCoordinates(e);
        setStartPoint(point);
        setCurrentRect({
            x: point.x,
            y: point.y,
            width: 0,
            height: 0
        });
    };
    
    const handleMouseMove = (e) => {
        if (!isDrawing || !currentRect) return;
        
        const currentPoint = getCanvasCoordinates(e);
        
        setCurrentRect({
            x: Math.min(startPoint.x, currentPoint.x),
            y: Math.min(startPoint.y, currentPoint.y),
            width: Math.abs(currentPoint.x - startPoint.x),
            height: Math.abs(currentPoint.y - startPoint.y)
        });
    };
    
    const handleMouseUp = () => {
        if (!isDrawing || !currentRect || !currentCategory) return;
        
        // Only add if the rect has some size
        if (currentRect.width > 5 && currentRect.height > 5) {
            // Convert rectangle to dent format
            const newDent = {
                center: {
                    x: currentRect.x + currentRect.width/2,
                    y: currentRect.y + currentRect.height/2
                },
                x_size: currentRect.width,
                y_size: currentRect.height,
                category: currentCategory
            };
            
            onAddDent(newDent);
        }
        
        // Reset drawing state
        setIsDrawing(false);
        setCurrentRect(null);
    };
    
    // Clean up if mouse leaves canvas
    const handleMouseLeave = () => {
        if (isDrawing) {
            setIsDrawing(false);
            setCurrentRect(null);
        }
    };
    
    return (
        <div 
            ref={canvasRef}
            className="absolute inset-0 z-10"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        >
            {currentRect && isDrawing && (
                <div 
                    className="absolute border-2 bg-opacity-30"
                    style={{
                        left: `${(currentRect.x * scale) + position.x}px`,
                        top: `${(currentRect.y * scale) + position.y}px`,
                        width: `${currentRect.width * scale}px`,
                        height: `${currentRect.height * scale}px`,
                        borderColor: DENT_CATEGORIES[currentCategory]?.color || '#fff',
                        backgroundColor: `${DENT_CATEGORIES[currentCategory]?.color}33` || 'rgba(255,255,255,0.2)'
                    }}
                />
            )}
        </div>
    );
};

// Updated DentOverlay with scale-aware dimensions
const DentOverlay = ({ dent, category, imageSize, isSelected, onSelect, scale }) => {
    const EXPANSION_FACTOR = 1.2;
    
    const getBoundedPosition = (center, size, maxSize) => {
        const expandedSize = size * EXPANSION_FACTOR;
        let position = center - (expandedSize/2);
        position = Math.max(0, Math.min(position, maxSize - expandedSize));
        return position;
    };

    const expandedXSize = dent.x_size * EXPANSION_FACTOR;
    const expandedYSize = dent.y_size * EXPANSION_FACTOR;
    const left = getBoundedPosition(dent.center.x, dent.x_size, imageSize.width);
    const top = getBoundedPosition(dent.center.y, dent.y_size, imageSize.height);
    
    return (
        <div
            className="absolute group cursor-pointer"
            style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${expandedXSize}px`,
                height: `${expandedYSize}px`,
                border: `${3/scale}px solid ${category.color}`,
                backgroundColor: `${category.color}22`,
                transition: 'background-color 0.2s ease-in-out',
                boxShadow: isSelected ? `0 0 0 ${2/scale}px white, 0 0 0 ${4/scale}px ${category.color}` : 'none'
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect?.();
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${category.color}44`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${category.color}22`;
            }}
        >
            {/* Center point marker */}
            <div 
                className="absolute rounded-full border-2 border-white"
                style={{
                    left: `${expandedXSize/2 - (4/scale)}px`,
                    top: `${expandedYSize/2 - (4/scale)}px`,
                    width: `${8/scale}px`,
                    height: `${8/scale}px`,
                    backgroundColor: category.color,
                    boxShadow: `0 0 ${3/scale}px rgba(0,0,0,0.5)`
                }}
            />
            
            {/* Always show location info, make it more visible on hover/select */}
            <div 
                className={`absolute -top-6 left-0 px-2 py-1 rounded text-xs whitespace-nowrap transition-opacity duration-200
                    ${isSelected || dent.hover ? 'opacity-100' : 'opacity-75'}`}
                style={{
                    backgroundColor: isSelected ? category.color : `${category.color}dd`,
                    color: 'white',
                    transform: `scale(${1/scale})`,
                    transformOrigin: 'bottom left'
                }}
            >
                {Math.round(dent.center.x)}, {Math.round(dent.center.y)}
            </div>
            
            {/* Add size info below the box */}
            <div 
                className={`absolute -bottom-6 left-0 px-2 py-1 rounded text-xs whitespace-nowrap transition-opacity duration-200
                    ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-75'}`}
                style={{
                    backgroundColor: `${category.color}dd`,
                    color: 'white',
                    transform: `scale(${1/scale})`,
                    transformOrigin: 'top left'
                }}
            >
                {Math.round(dent.x_size)}x{Math.round(dent.y_size)}px
            </div>
            
            {/* X and Y axis lines (only show when selected) */}
            {isSelected && (
                <>
                    {/* X-axis line */}
                    <div 
                        className="absolute bg-white opacity-70"
                        style={{
                            left: 0,
                            top: `${expandedYSize/2 - (1/scale)}px`,
                            width: '100%', 
                            height: `${2/scale}px`,
                            borderLeft: `${2/scale}px dashed ${category.color}`,
                            borderRight: `${2/scale}px dashed ${category.color}`
                        }}
                    />
                    
                    {/* Y-axis line */}
                    <div 
                        className="absolute bg-white opacity-70"
                        style={{
                            top: 0,
                            left: `${expandedXSize/2 - (1/scale)}px`,
                            height: '100%', 
                            width: `${2/scale}px`,
                            borderTop: `${2/scale}px dashed ${category.color}`,
                            borderBottom: `${2/scale}px dashed ${category.color}`
                        }}
                    />
                </>
            )}
        </div>
    );
};

// New component for displaying dent details
const DentDetails = ({ dent, category }) => {
    if (!dent) return null;

    return (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-200">
            <div className="flex items-center gap-2">
                <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: DENT_CATEGORIES[category].color }} 
                />
                <span className="font-semibold">{DENT_CATEGORIES[category].label} Dent</span>
            </div>
            
            <div className="space-y-4">
                <div>
                    <div className="text-sm text-gray-500 mb-1">Center Position</div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="font-mono flex items-center gap-4">
                            <div>
                                <span className="text-gray-500">x:</span> {Math.round(dent.center.x)}
                            </div>
                            <div>
                                <span className="text-gray-500">y:</span> {Math.round(dent.center.y)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div className="text-sm text-gray-500 mb-1">Dimensions</div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="font-mono flex items-center gap-4">
                            <div>
                                <span className="text-gray-500">w:</span> {Math.round(dent.x_size)}px
                            </div>
                            <div>
                                <span className="text-gray-500">h:</span> {Math.round(dent.y_size)}px
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="text-sm text-gray-500 mb-1">Area</div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="font-mono">
                            {Math.round(dent.x_size * dent.y_size)} px²
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DentDetection = () => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedImage, setSelectedImage] = useState(null);
    const [overlayData, setOverlayData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [selectedDent, setSelectedDent] = useState(null);
    const [filterCategory, setFilterCategory] = useState(null);
    
    // Drawing mode states
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [manualDents, setManualDents] = useState({});
    const [nextDentId, setNextDentId] = useState(1);
    
    // Modal state
    const [showInstructionModal, setShowInstructionModal] = useState(false);

    const containerRef = useRef(null);
    const imageRef = useRef(null);

    // Enhanced image loading with automatic scaling
    const handleImageLoad = (event) => {
        const { naturalWidth, naturalHeight } = event.target;
        setImageSize({ width: naturalWidth, height: naturalHeight });
        setScale(1); // Always start at 100% zoom
        
        // Center the image
        if (containerRef.current) {
            const container = containerRef.current;
            const centerX = (container.clientWidth - naturalWidth) / 2;
            const centerY = (container.clientHeight - naturalHeight) / 2;
            setPosition({ x: centerX, y: centerY });
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setIsLoading(true);
            setError(null);
            setSelectedDent(null);
            setFilterCategory(null);
            setManualDents({});
            setNextDentId(1);

            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
            setPosition({ x: 0, y: 0 });
            setScale(1);

            const response = await fetch(`${API_ENDPOINT}/get-image-overlay`);
            if (!response.ok) throw new Error('Failed to get analysis results');

            const data = await response.json();
            setOverlayData({
                dent_locations: data.dent_locations,
                total_dents: data.total_dents,
                dent_categories: data.dent_categories
            });
        } catch (error) {
            setError('Failed to process image. Please try again.');
            console.error('Error processing image:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Add a manual dent
    const handleAddDent = (dent) => {
        const id = `manual-${nextDentId}`;
        setManualDents(prev => ({
            ...prev,
            [id]: dent
        }));
        setNextDentId(prev => prev + 1);
        setSelectedDent(id);
    };

    // Enhanced zoom behavior with smooth animation
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const delta = e.deltaY * -0.01;
        const newScale = Math.min(Math.max(MIN_SCALE, scale + delta), MAX_SCALE);

        const scaleChange = newScale - scale;
        const newPosition = {
            x: position.x - ((x - position.x) * scaleChange) / scale,
            y: position.y - ((y - position.y) * scaleChange) / scale
        };

        setScale(newScale);
        setPosition(newPosition);
    }, [scale, position]);

    // Enhanced mouse controls
    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0 || isDrawingMode) return; // Only left mouse button and not in drawing mode
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
        e.currentTarget.style.cursor = 'grabbing';
    }, [position, isDrawingMode]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback((e) => {
        setIsDragging(false);
        if (e.currentTarget) {
            e.currentTarget.style.cursor = 'default';
        }
    }, []);

    const adjustScale = useCallback((delta) => {
        setScale(prevScale => {
            const newScale = Math.min(Math.max(MIN_SCALE, prevScale + delta), MAX_SCALE);
            return newScale;
        });
    }, []);

    const toggleDrawingMode = () => {
        if (!isDrawingMode) {
            // When entering drawing mode, show the instructions
            setShowInstructionModal(true);
        }
        setIsDrawingMode(!isDrawingMode);
        if (!isDrawingMode && !selectedCategory) {
            // Set a default category when entering drawing mode
            setSelectedCategory(Object.keys(DENT_CATEGORIES)[0]);
        }
    };

    const exportData = () => {
        // Combine API and manual dents
        const allDents = {
            ...(overlayData?.dent_locations || {}),
            ...manualDents
        };
        
        const data = {
            timestamp: new Date().toISOString(),
            imageSize,
            dents: allDents,
            categories: overlayData?.dent_categories || {}
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dent-analysis.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Combine API and manual dents
    const combinedDents = {
        ...(overlayData?.dent_locations || {}),
        ...manualDents
    };

    const dentCounts = Object.values(combinedDents).reduce((acc, dent) => {
        acc[dent.category] = (acc[dent.category] || 0) + 1;
        return acc;
    }, {});

    const totalDents = Object.values(dentCounts).reduce((sum, count) => sum + count, 0);

    const filteredDents = Object.entries(combinedDents);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Instructions Modal */}
            <InstructionModal 
                isOpen={showInstructionModal}
                onClose={() => setShowInstructionModal(false)}
            />
            
            {/* Left Panel */}
            <div className="w-72 bg-white border-r border-gray-200 p-6 shadow-lg">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-2">Results Summary</h2>
                    <p className="text-3xl font-bold text-blue-600">{totalDents} Dents</p>
                </div>

                {selectedDent && combinedDents[selectedDent] && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Selected Dent</h2>
                        <DentDetails 
                            dent={combinedDents[selectedDent]}
                            category={combinedDents[selectedDent].category}
                        />
                    </div>
                )}

                <div>
                    <h2 className="text-xl font-semibold mb-4">Categories</h2>
                    <div className="space-y-3">
                        {Object.entries(DENT_CATEGORIES).map(([key, { color, label }]) => (
                            <div 
                                key={key} 
                                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200
                                    ${filterCategory === key ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'}
                                    ${isDrawingMode && selectedCategory === key ? 'ring-2 ring-blue-500' : ''}`}
                                onClick={() => {
                                    if (isDrawingMode) {
                                        setSelectedCategory(key);
                                    } else {
                                        setFilterCategory(filterCategory === key ? null : key);
                                    }
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-5 h-5 rounded-full"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="font-medium">{label}</span>
                                </div>
                                <span className="text-lg font-semibold">{dentCounts[key] || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {selectedImage && (
                    <div className="mt-8">
                        <button
                            onClick={exportData}
                            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors duration-200"
                        >
                            <Download className="w-5 h-5" />
                            Export Analysis
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
                <div className="bg-white rounded-xl shadow-xl p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => document.getElementById('fileInput').click()}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-3 transition-colors duration-200 shadow-md"
                                disabled={isLoading}
                            >
                                <Upload className="w-5 h-5" />
                                {isLoading ? 'Processing...' : 'Upload Image'}
                                <input
                                    id="fileInput"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={isLoading}
                                />
                            </button>
                            
                            {isDrawingMode && selectedCategory && (
                                <div className="flex items-center px-4 py-2 bg-gray-100 rounded-lg">
                                    <span>Drawing: </span>
                                    <div 
                                        className="ml-2 w-4 h-4 rounded-full"
                                        style={{ backgroundColor: DENT_CATEGORIES[selectedCategory].color }}
                                    />
                                    <span className="ml-1 font-medium">{DENT_CATEGORIES[selectedCategory].label}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => adjustScale(-SCALE_STEP)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                disabled={scale <= MIN_SCALE}
                            >
                                <ZoomOut className="w-5 h-5" />
                                Zoom Out
                            </button>
                            <button
                                onClick={() => adjustScale(SCALE_STEP)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                disabled={scale >= MAX_SCALE}
                            >
                                <ZoomIn className="w-5 h-5" />
                                Zoom In
                            </button>
                            <button
                                onClick={toggleDrawingMode}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200
                                    ${isDrawingMode 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                            >
                                <Edit2 className="w-5 h-5" />
                                {isDrawingMode ? 'Exit Drawing' : 'Draw Dents'}
                            </button>
                            {isDrawingMode && (
                                <button
                                    onClick={() => setShowInstructionModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                >
                                    <Info className="w-5 h-5" />
                                    Help
                                </button>
                            )}
                        </div>
                    </div>

                    <div
                        ref={containerRef}
                        className={`relative flex-1 bg-gray-100 rounded-lg overflow-hidden ${isDrawingMode ? 'cursor-crosshair' : 'cursor-grab'}`}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={() => !isDrawingMode && setSelectedDent(null)}
                    >
                        <div
                            className="absolute origin-top-left"
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                            }}
                        >
                            {selectedImage && (
                                <div className="relative">
                                    <img
                                        ref={imageRef}
                                        src={selectedImage}
                                        alt="Uploaded"
                                        className="max-w-none"
                                        onLoad={handleImageLoad}
                                    />
                                    {filteredDents.map(([id, dent]) => (
                                        <DentOverlay
                                            key={id}
                                            dent={dent}
                                            category={DENT_CATEGORIES[dent.category]}
                                            imageSize={imageSize}
                                            isSelected={selectedDent === id}
                                            onSelect={() => !isDrawingMode && setSelectedDent(id)}
                                            scale={scale}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Drawing canvas layer */}
                        {isDrawingMode && selectedImage && (
                            <DrawingCanvas 
                                imageRef={imageRef}
                                scale={scale}
                                position={position}
                                onAddDent={handleAddDent}
                                currentCategory={selectedCategory}
                            />
                        )}

                        {!selectedImage && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg">
                                Upload an image to begin analysis
                            </div>
                        )}

                        {isLoading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <div className="bg-white rounded-lg p-6 shadow-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                                        <div className="text-xl">Processing image...</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                            <X className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    <div className="mt-4 flex justify-between items-center text-gray-600">
                        <div className="text-sm">
                            {imageSize.width > 0 && `Image size: ${imageSize.width}x${imageSize.height}px`}
                        </div>
                        <div className="font-medium">
                            Zoom: {Math.round(scale * 100)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DentDetection;