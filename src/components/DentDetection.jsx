import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, Upload, X, Filter, Download } from 'lucide-react';

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
        if (e.button !== 0) return; // Only left mouse button
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
        e.currentTarget.style.cursor = 'grabbing';
    }, [position]);

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

    const exportData = () => {
        const data = {
            timestamp: new Date().toISOString(),
            imageSize,
            dents: overlayData?.dent_locations || {},
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

    const dentCounts = Object.values(overlayData?.dent_locations || {}).reduce((acc, dent) => {
        acc[dent.category] = (acc[dent.category] || 0) + 1;
        return acc;
    }, {});

    const totalDents = Object.values(dentCounts).reduce((sum, count) => sum + count, 0);

    const filteredDents = filterCategory
        ? Object.entries(overlayData?.dent_locations || {}).filter(([_, dent]) => dent.category === filterCategory)
        : Object.entries(overlayData?.dent_locations || {});

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Left Panel */}
            <div className="w-72 bg-white border-r border-gray-200 p-6 shadow-lg">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-2">Results Summary</h2>
                    <p className="text-3xl font-bold text-blue-600">{totalDents} Dents</p>
                </div>

                {selectedDent && overlayData?.dent_locations[selectedDent] && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Selected Dent</h2>
                        <DentDetails 
                            dent={overlayData.dent_locations[selectedDent]}
                            category={overlayData.dent_locations[selectedDent].category}
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
                                    ${filterCategory === key ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'}`}
                                onClick={() => setFilterCategory(filterCategory === key ? null : key)}
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

                {overlayData && (
                    <button
                        onClick={exportData}
                        className="mt-8 w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors duration-200"
                    >
                        <Download className="w-5 h-5" />
                        Export Analysis
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
                <div className="bg-white rounded-xl shadow-xl p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
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

                        <div className="flex items-center gap-4">
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
                            <div className="flex items-center gap-2 text-gray-500">
                                <Move className="w-5 h-5" />
                                Drag to pan
                            </div>
                        </div>
                    </div>

                    <div
                        ref={containerRef}
                        className="relative flex-1 bg-gray-100 rounded-lg overflow-hidden cursor-grab"
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={() => setSelectedDent(null)}
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
                                            onSelect={() => setSelectedDent(id)}
                                            scale={scale}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

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