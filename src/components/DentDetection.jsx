import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, Upload, X, Filter, Download, Edit2, Save, Circle, Square, Info, Trash2, Edit3, Calendar, ArrowRight } from 'lucide-react';

const API_ENDPOINT = 'https://dent-detection-app.wittyglacier-9b6d796b.eastus.azurecontainerapps.io/detect/format';
const API_TOKEN = 'f9f0b1bc-82b1-sexy-8a4a-505359ddd8b5';

const DENT_CATEGORIES = {
    nickel: { color: '#a855f7', label: 'Nickel' },
    quarter: { color: '#3b82f6', label: 'Quarter' },
    half_dollar: { color: '#22c55e', label: 'Half Dollar' },
    oversized: { color: '#f59e0b', label: 'Oversize' }
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.2;

const InstructionModal = ({ isOpen, onClose, onDontShowAgain, onStartAnnotating }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">How to Annotate Dents</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex gap-3">
                            <Info className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-orange-800 mb-1">Quick Start Guide</h3>
                                <p className="text-orange-700 text-sm">Follow these simple steps to mark dents on your image professionally.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                            <div>
                                <h4 className="font-semibold text-blue-800 mb-1">Select Dent Category</h4>
                                <p className="text-blue-700 text-sm">Choose the appropriate dent size from the left panel (Nickel, Quarter, Half Dollar, or Oversize).</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                            <div>
                                <h4 className="font-semibold text-green-800 mb-1">Draw Dent Areas</h4>
                                <p className="text-green-700 text-sm">Click and drag on the image to outline each dent. You can draw as many dents as needed without exiting annotation mode.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                            <div>
                                <h4 className="font-semibold text-purple-800 mb-1">Continue or Finish</h4>
                                <p className="text-purple-700 text-sm">Keep drawing more dents or click "Exit Annotate" when you're finished. All annotations are saved automatically.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-2">💡 Pro Tips</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                            <li>• Switch between dent categories while annotating</li>
                            <li>• Use zoom controls for precise marking</li>
                            <li>• Edit or delete any dent annotations (AI or manual)</li>
                            <li>• Export your analysis when complete</li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-200">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        onDontShowAgain();
                                    }
                                }}
                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            Don't show this again
                        </label>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onStartAnnotating}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
                            >
                                Start Annotating
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DrawingCanvas = ({ imageRef, scale, position, onAddDent, currentCategory, onFinishDrawing }) => {
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

        e.stopPropagation();
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

        if (currentRect.width > 5 && currentRect.height > 5) {
            const newDent = {
                center: {
                    x: currentRect.x + currentRect.width / 2,
                    y: currentRect.y + currentRect.height / 2
                },
                x_size: currentRect.width,
                y_size: currentRect.height,
                category: currentCategory
            };

            onAddDent(newDent);
            onFinishDrawing();
        }

        setIsDrawing(false);
        setCurrentRect(null);
    };

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

const DentOverlay = ({ dentId, dent, category, imageSize, isSelected, onSelect, scale, scrollToTop }) => {
    const EXPANSION_FACTOR = 1.2;

    const getBoundedPosition = (center, size, maxSize) => {
        const expandedSize = size * EXPANSION_FACTOR;
        let position = center - (expandedSize / 2);
        position = Math.max(0, Math.min(position, maxSize - expandedSize));
        return position;
    };

    const expandedXSize = dent.x_size * EXPANSION_FACTOR;
    const expandedYSize = dent.y_size * EXPANSION_FACTOR;
    const left = getBoundedPosition(dent.center.x, dent.x_size, imageSize.width);
    const top = getBoundedPosition(dent.center.y, dent.y_size, imageSize.height);

    const handleClick = (e) => {
        e.stopPropagation();
        onSelect?.();

        if (scrollToTop) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div
            className="absolute group cursor-pointer"
            style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${expandedXSize}px`,
                height: `${expandedYSize}px`,
                border: `${3 / scale}px solid ${category.color}`,
                backgroundColor: `${category.color}22`,
                transition: 'background-color 0.2s ease-in-out',
                boxShadow: isSelected ? `0 0 0 ${2 / scale}px white, 0 0 0 ${4 / scale}px ${category.color}` : 'none'
            }}
            onClick={handleClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${category.color}44`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${category.color}22`;
            }}
        >
            <div
                className="absolute rounded-full border-2 border-white"
                style={{
                    left: `${expandedXSize / 2 - (4 / scale)}px`,
                    top: `${expandedYSize / 2 - (4 / scale)}px`,
                    width: `${8 / scale}px`,
                    height: `${8 / scale}px`,
                    backgroundColor: category.color,
                    boxShadow: `0 0 ${3 / scale}px rgba(0,0,0,0.5)`
                }}
            />

            <div
                className={`absolute -top-6 left-0 px-2 py-1 rounded text-xs whitespace-nowrap transition-opacity duration-200
                    ${isSelected || dent.hover ? 'opacity-100' : 'opacity-75'}`}
                style={{
                    backgroundColor: isSelected ? category.color : `${category.color}dd`,
                    color: 'white',
                    transform: `scale(${1 / scale})`,
                    transformOrigin: 'bottom left'
                }}
            >
                {Math.round(dent.center.x)}, {Math.round(dent.center.y)}
            </div>

            <div
                className={`absolute -bottom-6 left-0 px-2 py-1 rounded text-xs whitespace-nowrap transition-opacity duration-200
                    ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-75'}`}
                style={{
                    backgroundColor: `${category.color}dd`,
                    color: 'white',
                    transform: `scale(${1 / scale})`,
                    transformOrigin: 'top left'
                }}
            >
                {Math.round(dent.x_size)}x{Math.round(dent.y_size)}px
            </div>

            {isSelected && (
                <>
                    <div
                        className="absolute bg-white opacity-70"
                        style={{
                            left: 0,
                            top: `${expandedYSize / 2 - (1 / scale)}px`,
                            width: '100%',
                            height: `${2 / scale}px`,
                            borderLeft: `${2 / scale}px dashed ${category.color}`,
                            borderRight: `${2 / scale}px dashed ${category.color}`
                        }}
                    />

                    <div
                        className="absolute bg-white opacity-70"
                        style={{
                            top: 0,
                            left: `${expandedXSize / 2 - (1 / scale)}px`,
                            height: '100%',
                            width: `${2 / scale}px`,
                            borderTop: `${2 / scale}px dashed ${category.color}`,
                            borderBottom: `${2 / scale}px dashed ${category.color}`
                        }}
                    />
                </>
            )}
        </div>
    );
};

const DentDetails = ({ dent, category, dentId, onEdit, onDelete }) => {
    if (!dent) return null;

    return (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: DENT_CATEGORIES[category].color }}
                    />
                    <span className="font-semibold">{DENT_CATEGORIES[category].label} Dent</span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(dentId)}
                        className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                        title="Edit dent"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(dentId)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete dent"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
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

const SaveAnnotationModal = ({ isOpen, onClose, onSave }) => {
    if (!isOpen) return null;

    const [filename, setFilename] = useState('dent-analysis');
    const [exportOptions, setExportOptions] = useState({
        json: true,
        annotatedImage: true,
        originalImage: false
    });

    const handleSave = () => {
        onSave(filename, exportOptions);
        onClose();
    };

    const toggleOption = (option) => {
        setExportOptions(prev => ({
            ...prev,
            [option]: !prev[option]
        }));
    };

    const isValidSelection = exportOptions.json || exportOptions.annotatedImage || exportOptions.originalImage;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Export Analysis</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filename
                        </label>
                        <input
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Enter filename"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Export Options
                        </label>
                        
                        <div className="space-y-3">
                            <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                exportOptions.json 
                                    ? 'border-orange-500 bg-orange-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleOption('json')}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.json}
                                        onChange={() => toggleOption('json')}
                                        className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                    />
                                    <div>
                                        <div className="font-semibold text-gray-800">Analysis Data (JSON)</div>
                                        <div className="text-sm text-gray-600">Dent locations, categories, and measurements</div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                exportOptions.annotatedImage 
                                    ? 'border-orange-500 bg-orange-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleOption('annotatedImage')}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.annotatedImage}
                                        onChange={() => toggleOption('annotatedImage')}
                                        className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                    />
                                    <div>
                                        <div className="font-semibold text-gray-800">Annotated Image (PNG)</div>
                                        <div className="text-sm text-gray-600">Image with visible dent markings and branding</div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                exportOptions.originalImage 
                                    ? 'border-orange-500 bg-orange-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleOption('originalImage')}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.originalImage}
                                        onChange={() => toggleOption('originalImage')}
                                        className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                    />
                                    <div>
                                        <div className="font-semibold text-gray-800">Original Image (Copy)</div>
                                        <div className="text-sm text-gray-600">Clean copy of the uploaded image</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!isValidSelection && (
                            <p className="text-sm text-red-600 mt-3 font-medium">
                                Please select at least one export option
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200">
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!isValidSelection}
                                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors duration-200 font-medium shadow-lg"
                            >
                                <Download className="w-4 h-4" />
                                Export Files
                            </button>
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
    const [aiDents, setAiDents] = useState({}); // AI detected dents
    const [manualDents, setManualDents] = useState({}); // Manually added dents
    const [modifiedAiDents, setModifiedAiDents] = useState({}); // Modified AI dents
    const [deletedDents, setDeletedDents] = useState(new Set()); // Deleted dent IDs
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [selectedDent, setSelectedDent] = useState(null);
    const [filterCategory, setFilterCategory] = useState(null);

    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [nextDentId, setNextDentId] = useState(1);

    const [showInstructionModal, setShowInstructionModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [hideInstructions, setHideInstructions] = useState(false);

    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleImageLoad = (event) => {
        const { naturalWidth, naturalHeight } = event.target;
        setImageSize({ width: naturalWidth, height: naturalHeight });
        
        if (containerRef.current) {
            const container = containerRef.current;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            const scaleX = containerWidth / naturalWidth;
            const scaleY = containerHeight / naturalHeight;
            const initialScale = Math.min(scaleX, scaleY, 1);
            
            setScale(initialScale);
            
            const scaledWidth = naturalWidth * initialScale;
            const scaledHeight = naturalHeight * initialScale;
            const centerX = (containerWidth - scaledWidth) / 2;
            const centerY = (containerHeight - scaledHeight) / 2;
            
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
            setAiDents({});
            setManualDents({});
            setModifiedAiDents({});
            setDeletedDents(new Set());
            setNextDentId(1);

            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
            setPosition({ x: 0, y: 0 });
            setScale(1);

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('https://dent-detection-app.wittyglacier-9b6d796b.eastus.azurecontainerapps.io/detect/format?threshold=0.05', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_TOKEN}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`API responded with status: ${response.status}`);
                }

                const data = await response.json();
                console.log("API Response:", data);

                setAiDents(data.dent_locations || {});
            } catch (apiError) {
                console.error("API Error:", apiError);

                console.log("Falling back to sample data for testing");
                const mockData = {
                    "dent_1": {
                        "center": { "x": 150, "y": 200 },
                        "x_size": 45,
                        "y_size": 30,
                        "category": "nickel"
                    },
                    "dent_2": {
                        "center": { "x": 350, "y": 180 },
                        "x_size": 60,
                        "y_size": 35,
                        "category": "quarter"
                    },
                    "dent_3": {
                        "center": { "x": 250, "y": 300 },
                        "x_size": 85,
                        "y_size": 45,
                        "category": "half_dollar"
                    }
                };

                setAiDents(mockData);
                setError('Could not connect to AI service. Using sample data instead.');
            }
        } catch (error) {
            setError('Failed to process image. Please try again.');
            console.error('Error processing image:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDent = (dent) => {
        const id = `manual-${nextDentId}`;
        setManualDents(prev => ({
            ...prev,
            [id]: dent
        }));
        setNextDentId(prev => prev + 1);
        setSelectedDent(id);
    };

    const handleEditDent = (dentId) => {
        setSelectedDent(dentId);
        setIsEditMode(true);
    };

    const updateDent = (dentId, property, value) => {
        const updateDentData = (dent, property, value) => {
            const updatedDent = { ...dent };
            
            if (property.includes('.')) {
                const [parent, child] = property.split('.');
                updatedDent[parent] = { ...updatedDent[parent], [child]: parseFloat(value) };
            } else {
                updatedDent[property] = property === 'category' ? value : parseFloat(value);
            }
            
            return updatedDent;
        };

        if (dentId.startsWith('manual-')) {
            // Update manual dent
            setManualDents(prev => ({
                ...prev,
                [dentId]: updateDentData(prev[dentId], property, value)
            }));
        } else {
            // Update AI dent - move to modified collection
            const originalDent = aiDents[dentId] || modifiedAiDents[dentId];
            if (originalDent) {
                setModifiedAiDents(prev => ({
                    ...prev,
                    [dentId]: updateDentData(originalDent, property, value)
                }));
            }
        }
    };

    const handleDeleteDent = (dentId) => {
        if (dentId.startsWith('manual-')) {
            // Delete manual dent
            setManualDents(prev => {
                const newDents = { ...prev };
                delete newDents[dentId];
                return newDents;
            });
        } else {
            // Mark AI dent as deleted
            setDeletedDents(prev => new Set([...prev, dentId]));
        }

        if (selectedDent === dentId) {
            setSelectedDent(null);
            setIsEditMode(false);
        }
    };

    const createAnnotatedImage = async () => {
        return new Promise((resolve) => {
            if (!selectedImage || !imageRef.current) {
                resolve(null);
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = imageRef.current;

            // Add padding for branding and title
            const padding = 100;
            const headerHeight = 80;
            const footerHeight = 60;
            
            canvas.width = img.naturalWidth + (padding * 2);
            canvas.height = img.naturalHeight + headerHeight + footerHeight + (padding * 2);

            // Fill background with white
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add header with title and branding
            const headerY = padding;
            
            // Title
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 32px Arial, sans-serif';
            ctx.textAlign = 'left';
            const title = 'Dent Analysis Report';
            ctx.fillText(title, padding, headerY + 30);
            
            // Subtitle with date
            ctx.fillStyle = '#6b7280';
            ctx.font = '18px Arial, sans-serif';
            const date = new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            ctx.fillText(`Generated on ${date}`, padding, headerY + 60);

            // Company branding (top right)
            ctx.fillStyle = '#f97316';
            ctx.font = 'bold 24px Arial, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('Obai', canvas.width - padding, headerY + 30);
            
            ctx.fillStyle = '#9ca3af';
            ctx.font = '14px Arial, sans-serif';
            ctx.fillText('Professional Dent Analysis Solution', canvas.width - padding, headerY + 50);

            // Draw separator line
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(padding, headerY + 75);
            ctx.lineTo(canvas.width - padding, headerY + 75);
            ctx.stroke();

            // Draw the original image
            const imageY = headerY + headerHeight;
            ctx.drawImage(img, padding, imageY);

            // Draw dent overlays on the image
            Object.entries(getAllActiveDents()).forEach(([id, dent]) => {
                const category = DENT_CATEGORIES[dent.category];
                if (!category) return;

                const EXPANSION_FACTOR = 1.2;
                const expandedXSize = dent.x_size * EXPANSION_FACTOR;
                const expandedYSize = dent.y_size * EXPANSION_FACTOR;
                
                const left = padding + Math.max(0, Math.min(
                    dent.center.x - (expandedXSize / 2),
                    img.naturalWidth - expandedXSize
                ));
                const top = imageY + Math.max(0, Math.min(
                    dent.center.y - (expandedYSize / 2),
                    img.naturalHeight - expandedYSize
                ));

                // Draw dent rectangle
                ctx.strokeStyle = category.color;
                ctx.lineWidth = 4;
                ctx.setLineDash([]);
                ctx.strokeRect(left, top, expandedXSize, expandedYSize);

                // Fill with semi-transparent color
                ctx.fillStyle = `${category.color}40`;
                ctx.fillRect(left, top, expandedXSize, expandedYSize);

                // Draw center point
                ctx.beginPath();
                ctx.arc(padding + dent.center.x, imageY + dent.center.y, 8, 0, 2 * Math.PI);
                ctx.fillStyle = category.color;
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Draw label with better styling
                const labelText = `${category.label}`;
                ctx.font = 'bold 16px Arial, sans-serif';
                ctx.fillStyle = 'white';
                ctx.strokeStyle = category.color;
                ctx.lineWidth = 4;
                ctx.textAlign = 'left';
                
                const textMetrics = ctx.measureText(labelText);
                const labelX = Math.max(padding + 5, Math.min(left, canvas.width - textMetrics.width - 15));
                const labelY = Math.max(imageY + 25, top - 8);
                
                // Label background
                ctx.fillStyle = category.color;
                ctx.fillRect(labelX - 5, labelY - 18, textMetrics.width + 10, 22);
                
                ctx.fillStyle = 'white';
                ctx.fillText(labelText, labelX, labelY);

                // Draw coordinates and dimensions
                const coordText = `(${Math.round(dent.center.x)}, ${Math.round(dent.center.y)})`;
                const dimText = `${Math.round(dent.x_size)}×${Math.round(dent.y_size)}px`;
                
                ctx.font = '12px Arial, sans-serif';
                ctx.fillStyle = '#374151';
                
                const coordY = Math.min(canvas.height - footerHeight - 25, top + expandedYSize + 15);
                ctx.fillText(coordText, labelX, coordY);
                ctx.fillText(dimText, labelX, coordY + 15);
            });

            // Footer with summary and branding
            const footerY = canvas.height - footerHeight;
            
            // Summary statistics
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 18px Arial, sans-serif';
            ctx.textAlign = 'left';
            const totalDents = Object.keys(getAllActiveDents()).length;
            ctx.fillText(`Total Dents Found: ${totalDents}`, padding, footerY + 25);
            
            // Category breakdown
            const dentCounts = Object.values(getAllActiveDents()).reduce((acc, dent) => {
                acc[dent.category] = (acc[dent.category] || 0) + 1;
                return acc;
            }, {});
            
            ctx.font = '14px Arial, sans-serif';
            ctx.fillStyle = '#6b7280';
            let breakdownText = 'Categories: ';
            Object.entries(dentCounts).forEach(([category, count], index) => {
                if (index > 0) breakdownText += ', ';
                breakdownText += `${DENT_CATEGORIES[category]?.label || category}: ${count}`;
            });
            ctx.fillText(breakdownText, padding, footerY + 45);

            // Footer branding
            ctx.fillStyle = '#9ca3af';
            ctx.font = '12px Arial, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('© 2024 Obai - Professional Vehicle Analysis', canvas.width - padding, footerY + 45);

            canvas.toBlob(resolve, 'image/png', 0.95);
        });
    };

    const saveAnnotation = async (filename = 'dent-analysis', options = { json: true }) => {
        try {
            const filesToDownload = [];
            
            // Prepare JSON data
            if (options.json) {
                const allDents = getAllActiveDents();

                const jsonData = {
                    total_dents: Object.keys(allDents).length,
                    dent_locations: allDents,
                    dent_categories: Object.fromEntries(
                        Object.entries(DENT_CATEGORIES).map(([key, { label }]) => [key, label])
                    ),
                    export_timestamp: new Date().toISOString(),
                    image_dimensions: imageSize
                };

                const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                filesToDownload.push({ blob: jsonBlob, filename: `${filename}.json` });
            }

            // Create annotated image
            if (options.annotatedImage) {
                const annotatedBlob = await createAnnotatedImage();
                if (annotatedBlob) {
                    filesToDownload.push({ blob: annotatedBlob, filename: `${filename}_annotated.png` });
                }
            }

            // Add original image
            if (options.originalImage && selectedImage) {
                try {
                    const response = await fetch(selectedImage);
                    const originalBlob = await response.blob();
                    const extension = originalBlob.type.split('/')[1] || 'jpg';
                    filesToDownload.push({ blob: originalBlob, filename: `${filename}_original.${extension}` });
                } catch (error) {
                    console.error('Error fetching original image:', error);
                }
            }

            // Download files
            if (filesToDownload.length === 1) {
                // Single file download
                const { blob, filename: fileName } = filesToDownload[0];
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else if (filesToDownload.length > 1) {
                // Multiple files - create ZIP
                const JSZip = await import('https://cdn.skypack.dev/jszip');
                const zip = new JSZip.default();

                filesToDownload.forEach(({ blob, filename: fileName }) => {
                    zip.file(fileName, blob);
                });

                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename}_export.zip`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }

        } catch (error) {
            console.error('Error saving annotation:', error);
            setError('Failed to export files. Please try again.');
        }
    };

    // Helper function to get all active dents (combining AI, modified AI, and manual)
    const getAllActiveDents = () => {
        const activeDents = {};
        
        // Add AI dents that haven't been deleted or modified
        Object.entries(aiDents).forEach(([id, dent]) => {
            if (!deletedDents.has(id) && !modifiedAiDents[id]) {
                activeDents[id] = dent;
            }
        });

        // Add modified AI dents that haven't been deleted
        Object.entries(modifiedAiDents).forEach(([id, dent]) => {
            if (!deletedDents.has(id)) {
                activeDents[id] = dent;
            }
        });

        // Add manual dents
        Object.entries(manualDents).forEach(([id, dent]) => {
            activeDents[id] = dent;
        });

        return activeDents;
    };

    // Helper function to get current dent data for a specific ID
    const getCurrentDentData = (dentId) => {
        if (dentId.startsWith('manual-')) {
            return manualDents[dentId];
        } else if (modifiedAiDents[dentId]) {
            return modifiedAiDents[dentId];
        } else {
            return aiDents[dentId];
        }
    };

    // Helper function to check if a dent is AI-detected
    const isAIDent = (dentId) => {
        return !dentId.startsWith('manual-');
    };

    useEffect(() => {
        const hideInstructionsPref = localStorage.getItem('hideDentInstructions');
        if (hideInstructionsPref === 'true') {
            setHideInstructions(true);
        }
    }, []);

    useEffect(() => {
        const currentContainer = containerRef.current;

        if (currentContainer) {
            const wheelHandler = (e) => {
                e.preventDefault();
                const rect = currentContainer.getBoundingClientRect();
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
            };

            currentContainer.addEventListener('wheel', wheelHandler, { passive: false });

            return () => {
                currentContainer.removeEventListener('wheel', wheelHandler);
            };
        }
    }, [scale, position]);

    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0 || isDrawingMode) return;
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
            if (!hideInstructions) {
                setShowInstructionModal(true);
                return; 
            }
            setIsDrawingMode(true);
            setIsEditMode(false);
            if (!selectedCategory) {
                setSelectedCategory(Object.keys(DENT_CATEGORIES)[0]);
            }
        } else {
            setIsDrawingMode(false);
            setIsEditMode(false);
        }
    };

    const startDrawingMode = () => {
        setIsDrawingMode(true);
        setIsEditMode(false);
        if (!selectedCategory) {
            setSelectedCategory(Object.keys(DENT_CATEGORIES)[0]);
        }
        setShowInstructionModal(false);
    };

    const handleDontShowAgain = () => {
        setHideInstructions(true);
        localStorage.setItem('hideDentInstructions', 'true');
    };

    const handleFinishDrawing = async () => {
        // Auto-save functionality could be implemented here if needed
        console.log("Drawing finished, auto-saving...");
    };

    // Get all active dents and calculate stats
    const allActiveDents = getAllActiveDents();
    const dentCounts = Object.values(allActiveDents).reduce((acc, dent) => {
        acc[dent.category] = (acc[dent.category] || 0) + 1;
        return acc;
    }, {});
    const totalDents = Object.values(dentCounts).reduce((sum, count) => sum + count, 0);

    const filteredDents = Object.entries(allActiveDents)
        .filter(([_, dent]) => !filterCategory || dent.category === filterCategory);

    const currentSelectedDent = selectedDent ? getCurrentDentData(selectedDent) : null;

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
            <InstructionModal
                isOpen={showInstructionModal}
                onClose={() => setShowInstructionModal(false)}
                onDontShowAgain={handleDontShowAgain}
                onStartAnnotating={startDrawingMode}
            />

            <SaveAnnotationModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onSave={(filename, options) => {
                    saveAnnotation(filename, options);
                    setShowSaveModal(false);
                }}
            />

            <div className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 p-4 lg:p-6 shadow-lg order-2 lg:order-1">
                <div className="mb-6 lg:mb-8">
                    <h2 className="text-xl lg:text-2xl font-semibold mb-2">Results Summary</h2>
                    <p className="text-2xl lg:text-3xl font-bold text-orange-600">{totalDents} Dents</p>
                </div>

                {selectedDent && currentSelectedDent && (
                    <div className="mb-6 lg:mb-8">
                        <h2 className="text-lg lg:text-xl font-semibold mb-4">Selected Dent</h2>
                        {isEditMode ? (
                            <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: DENT_CATEGORIES[currentSelectedDent.category].color }}
                                        />
                                        <span className="font-semibold">Edit Dent</span>
                                    </div>
                                    <button
                                        onClick={() => setIsEditMode(false)}
                                        className="p-1 rounded hover:bg-gray-200 transition-colors duration-150"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category
                                        </label>
                                        <select
                                            value={currentSelectedDent.category}
                                            onChange={(e) => updateDent(selectedDent, 'category', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        >
                                            {Object.entries(DENT_CATEGORIES).map(([key, { label }]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Center Position
                                        </label>
                                        <div className="flex space-x-2">
                                            <div className="w-1/2">
                                                <label className="block text-xs text-gray-500">X</label>
                                                <input
                                                    type="number"
                                                    value={Math.round(currentSelectedDent.center.x)}
                                                    onChange={(e) => updateDent(selectedDent, 'center.x', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                            <div className="w-1/2">
                                                <label className="block text-xs text-gray-500">Y</label>
                                                <input
                                                    type="number"
                                                    value={Math.round(currentSelectedDent.center.y)}
                                                    onChange={(e) => updateDent(selectedDent, 'center.y', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Dimensions
                                        </label>
                                        <div className="flex space-x-2">
                                            <div className="w-1/2">
                                                <label className="block text-xs text-gray-500">Width</label>
                                                <input
                                                    type="number"
                                                    value={Math.round(currentSelectedDent.x_size)}
                                                    onChange={(e) => updateDent(selectedDent, 'x_size', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                            <div className="w-1/2">
                                                <label className="block text-xs text-gray-500">Height</label>
                                                <input
                                                    type="number"
                                                    value={Math.round(currentSelectedDent.y_size)}
                                                    onChange={(e) => updateDent(selectedDent, 'y_size', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-between">
                                        <button
                                            onClick={() => handleDeleteDent(selectedDent)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-1 transition-colors duration-200"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => setIsEditMode(false)}
                                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg flex items-center gap-1 transition-colors duration-200"
                                        >
                                            <Save className="w-4 h-4" />
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <DentDetails
                                dent={currentSelectedDent}
                                category={currentSelectedDent.category}
                                dentId={selectedDent}
                                onEdit={handleEditDent}
                                onDelete={handleDeleteDent}
                            />
                        )}
                    </div>
                )}

                <div>
                    <h2 className="text-lg lg:text-xl font-semibold mb-4">Categories</h2>

                    {filterCategory !== null && (
                        <button
                            className="flex items-center justify-center w-full p-2 mb-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 transition-all duration-200 border border-orange-200"
                            onClick={() => setFilterCategory(null)}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Reset Filter
                        </button>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-3 lg:space-y-0">
                        {Object.entries(DENT_CATEGORIES).map(([key, { color, label }]) => (
                            <div
                                key={key}
                                className={`flex items-center justify-between p-2 lg:p-3 rounded-lg transition-all duration-200 cursor-pointer
                    ${filterCategory === key ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'}
                    ${isDrawingMode && selectedCategory === key ? 'ring-2 ring-orange-500' : ''}`}
                                onClick={() => {
                                    if (isDrawingMode) {
                                        setSelectedCategory(key);
                                    } else {
                                        setFilterCategory(filterCategory === key ? null : key);
                                    }
                                }}
                            >
                                <div className="flex items-center gap-2 lg:gap-3">
                                    <div
                                        className="w-4 h-4 lg:w-5 lg:h-5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="font-medium text-sm lg:text-base truncate">{label}</span>
                                </div>
                                <span className="text-base lg:text-lg font-semibold">{dentCounts[key] || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {selectedImage && (
                    <div className="mt-6 lg:mt-8 space-y-3">
                        <button
                            onClick={() => setShowSaveModal(true)}
                            className="w-full flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-3 rounded-lg transition-colors duration-200 border border-orange-200"
                        >
                            <Download className="w-4 h-4 lg:w-5 lg:h-5" />
                            <span className="text-sm lg:text-base">Export Analysis</span>
                        </button>
                        
                        <button
                            onClick={() => window.open('https://calendly.com/team-obai/intro-conversation', '_blank')}
                            className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-3 rounded-lg transition-colors duration-200 border border-blue-200"
                        >
                            <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />
                             <span className="text-sm lg:text-base">Request Batch Access</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 p-4 lg:p-6 order-1 lg:order-2 min-h-screen lg:min-h-0">
                <div className="bg-white rounded-xl shadow-xl p-4 lg:p-6 h-full flex flex-col min-h-[70vh] lg:min-h-0">
                    {/* Header Section */}
                    <div className="mb-4 lg:mb-6 space-y-4">
                        {/* Top Row - Main Actions */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg flex items-center gap-2 lg:gap-3 transition-colors duration-200 shadow-md text-sm lg:text-base font-medium"
                                    disabled={isLoading}
                                >
                                    <Upload className="w-4 h-4 lg:w-5 lg:h-5" />
                                    {isLoading ? 'Processing...' : 'Upload Image'}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        disabled={isLoading}
                                    />
                                </button>

                                {!isDrawingMode && (
                                    <div className="hidden sm:block p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-xs lg:text-sm text-blue-700">
                                            Need to upload multiple images?{' '}
                                            <a
                                                href="https://calendly.com/team-obai/intro-conversation"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 font-medium text-blue-800 hover:text-blue-900 underline decoration-2 underline-offset-2 transition-colors duration-200"
                                            >
                                                <Calendar className="w-3 h-3" />
                                                Talk to our team
                                                <ArrowRight className="w-3 h-3" />
                                            </a>
                                            {' '}for batch processing access.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Control Buttons */}
                            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                                    <button
                                        onClick={() => adjustScale(-SCALE_STEP)}
                                        className="flex items-center gap-1 px-2 lg:px-3 py-1.5 bg-white hover:bg-gray-100 rounded transition-colors duration-200 text-sm lg:text-base shadow-sm"
                                        disabled={scale <= MIN_SCALE}
                                    >
                                        <ZoomOut className="w-4 h-4" />
                                        <span className="hidden sm:inline text-xs lg:text-sm">Out</span>
                                    </button>
                                    <span className="text-xs lg:text-sm text-gray-600 px-2 font-mono">
                                        {Math.round(scale * 100)}%
                                    </span>
                                    <button
                                        onClick={() => adjustScale(SCALE_STEP)}
                                        className="flex items-center gap-1 px-2 lg:px-3 py-1.5 bg-white hover:bg-gray-100 rounded transition-colors duration-200 text-sm lg:text-base shadow-sm"
                                        disabled={scale >= MAX_SCALE}
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                        <span className="hidden sm:inline text-xs lg:text-sm">In</span>
                                    </button>
                                </div>

                                <button
                                    onClick={toggleDrawingMode}
                                    className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all duration-200 text-sm lg:text-base font-medium shadow-sm
                                        ${isDrawingMode
                                            ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg'
                                            : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'}`}
                                    disabled={!selectedImage}
                                >
                                    <Edit2 className="w-4 h-4 lg:w-5 lg:h-5" />
                                    <span>{isDrawingMode ? 'Exit Annotate' : 'Annotate'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Annotation Mode Bar */}
                        {isDrawingMode && (
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                                            <span className="font-semibold text-orange-800 text-sm lg:text-base">
                                                Annotation Mode Active
                                            </span>
                                        </div>
                                        
                                        {selectedCategory && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-orange-200 shadow-sm">
                                                <span className="text-sm text-gray-600">Drawing:</span>
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: DENT_CATEGORIES[selectedCategory].color }}
                                                />
                                                <span className="font-medium text-sm text-gray-800">
                                                    {DENT_CATEGORIES[selectedCategory].label}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowInstructionModal(true)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200 text-sm font-medium"
                                        >
                                            <Info className="w-4 h-4" />
                                            <span>Help</span>
                                        </button>
                                        
                                        <div className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                            Click & drag to mark dents
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mobile Notice (only when not in drawing mode) */}
                        {!isDrawingMode && (
                            <div className="sm:hidden p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs text-blue-700">
                                    Need multiple images?{' '}
                                    <a
                                        href="https://calendly.com/team-obai/intro-conversation"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 font-medium text-blue-800 hover:text-blue-900 underline decoration-2 underline-offset-2 transition-colors duration-200"
                                    >
                                        <Calendar className="w-3 h-3" />
                                        Talk to team
                                        <ArrowRight className="w-3 h-3" />
                                    </a>
                                </p>
                            </div>
                        )}
                    </div>

                    <div
                        ref={containerRef}
                        className={`relative flex-1 bg-gray-100 rounded-lg overflow-hidden h-64 sm:h-80 md:h-96 lg:min-h-96 lg:h-full transition-all duration-200 ${
                            isDrawingMode 
                                ? 'cursor-crosshair ring-2 ring-orange-300 ring-opacity-50' 
                                : 'cursor-grab'
                        }`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={() => {
                            if (!isDrawingMode) {
                                setSelectedDent(null);
                                setIsEditMode(false);
                            }
                        }}
                    >

                        <div
                            className="absolute origin-top-left w-full h-full"
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
                                        className="max-w-none block"
                                        onLoad={handleImageLoad}
                                        style={{
                                            maxHeight: 'none',
                                            height: 'auto',
                                            width: 'auto'
                                        }}
                                    />
                                    {filteredDents.map(([id, dent]) => (
                                        <DentOverlay
                                            key={id}
                                            dentId={id}
                                            dent={dent}
                                            category={DENT_CATEGORIES[dent.category]}
                                            imageSize={imageSize}
                                            isSelected={selectedDent === id}
                                            onSelect={() => {
                                                if (!isDrawingMode) {
                                                    setSelectedDent(id);
                                                    setIsEditMode(false);
                                                }
                                            }}
                                            scale={scale}
                                            scrollToTop={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {isDrawingMode && selectedImage && (
                            <DrawingCanvas
                                imageRef={imageRef}
                                scale={scale}
                                position={position}
                                onAddDent={handleAddDent}
                                currentCategory={selectedCategory}
                                onFinishDrawing={handleFinishDrawing}
                            />
                        )}

                        {!selectedImage && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-base lg:text-lg text-center px-4">
                                Upload an image to begin analysis
                            </div>
                        )}

                        {isLoading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <div className="bg-white rounded-lg p-4 lg:p-6 shadow-xl mx-4">
                                    <div className="flex items-center gap-3">
                                        <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-4 border-orange-500 border-t-transparent"></div>
                                        <div className="text-lg lg:text-xl">Processing image...</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-3 lg:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                            <X className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                            <span className="text-sm lg:text-base">{error}</span>
                        </div>
                    )}

                    <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center text-gray-600 space-y-2 sm:space-y-0">
                        <div className="text-xs lg:text-sm">
                            {imageSize.width > 0 && `Image size: ${imageSize.width}x${imageSize.height}px`}
                        </div>
                        <div className="font-medium text-sm lg:text-base">
                            Zoom: {Math.round(scale * 100)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DentDetection;