import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, Upload, X, Filter, Download, Edit2, Save, Circle, Square, Info, Trash2, Edit3 } from 'lucide-react';

const API_ENDPOINT = 'https://identity-ai-911315419859.us-east1.run.app/detect/format';
const API_TOKEN = 'f9f0b1bc-82b1-sexy-8a4a-505359ddd8b5';

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
                    <div className="bg-orange-50 p-4 rounded-lg flex gap-3">
                        <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-orange-700">Follow these steps to properly mark dents on your image.</p>
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
                            <span className="font-medium">Automatic saving</span>
                            <p className="text-gray-600 text-sm mt-1">Your drawing will be automatically saved when you finish drawing each dent.</p>
                        </li>
                    </ol>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                        >
                            Proceed to Drawing
                        </button>
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

    const isManualDent = dentId && dentId.startsWith('manual-');

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
                    {/* X-axis line */}
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

                    {/* Y-axis line */}
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

    const isManualDent = dentId && dentId.startsWith('manual-');

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

                {isManualDent && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onEdit(dentId)}
                            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(dentId)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
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

// Save annotation dialog
const SaveAnnotationModal = ({ isOpen, onClose, onSave }) => {
    if (!isOpen) return null;

    const [filename, setFilename] = useState('dent-analysis');

    const handleSave = () => {
        onSave(filename);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Save Annotation</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filename
                        </label>
                        <input
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Enter filename without extension"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            File will be saved with .json extension
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <div className="flex space-x-2">
                            <button
                                onClick={onClose}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                            >
                                <Save className="w-4 h-4" />
                                Save
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
    const [overlayData, setOverlayData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [selectedDent, setSelectedDent] = useState(null);
    const [filterCategory, setFilterCategory] = useState(null);

    // Drawing mode states
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [manualDents, setManualDents] = useState({});
    const [nextDentId, setNextDentId] = useState(1);

    // Modal states
    const [showInstructionModal, setShowInstructionModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);

    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleImageLoad = (event) => {
        const { naturalWidth, naturalHeight } = event.target;
        setImageSize({ width: naturalWidth, height: naturalHeight });
        setScale(1);

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

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('https://identity-ai-911315419859.us-east1.run.app/detect/format', {
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

                setOverlayData({
                    dent_locations: data.dent_locations || {},
                    total_dents: data.total_dents || 0,
                    dent_categories: data.dent_categories || {}
                });
            } catch (apiError) {
                console.error("API Error:", apiError);

                console.log("Falling back to sample data for testing");
                const mockData = {
                    total_dents: 3,
                    dent_locations: {
                        "dent_1": {
                            "center": { "x": 150, "y": 200 },
                            "x_size": 45,
                            "y_size": 30,
                            "category": "dime"
                        },
                        "dent_2": {
                            "center": { "x": 350, "y": 180 },
                            "x_size": 60,
                            "y_size": 35,
                            "category": "nickel"
                        },
                        "dent_3": {
                            "center": { "x": 250, "y": 300 },
                            "x_size": 85,
                            "y_size": 45,
                            "category": "quarter"
                        }
                    },
                    dent_categories: DENT_CATEGORIES
                };

                setOverlayData({
                    dent_locations: mockData.dent_locations || {},
                    total_dents: mockData.total_dents || 0,
                    dent_categories: mockData.dent_categories || {}
                });

                setError('Could not connect to AI service. Using sample data instead.');
            }
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

    // Edit a dent
    const handleEditDent = (dentId) => {
        if (!dentId || !dentId.startsWith('manual-')) return;

        setSelectedDent(dentId);
        setIsEditMode(true);
    };

    // Function to update dent properties
    const updateDent = (dentId, property, value) => {
        if (!dentId.startsWith('manual-')) return;

        setManualDents(prev => {
            const dent = { ...prev[dentId] };

            if (property.includes('.')) {
                const [parent, child] = property.split('.');
                dent[parent] = { ...dent[parent], [child]: parseFloat(value) };
            } else {
                dent[property] = property === 'category' ? value : parseFloat(value);
            }

            return { ...prev, [dentId]: dent };
        });
    };

    // Delete a dent
    const handleDeleteDent = (dentId) => {
        if (!dentId.startsWith('manual-')) return;

        setManualDents(prev => {
            const newDents = { ...prev };
            delete newDents[dentId];
            return newDents;
        });

        if (selectedDent === dentId) {
            setSelectedDent(null);
            setIsEditMode(false);
        }
    };


    const saveAnnotation = (filename = 'dent-analysis') => {
        try {
            const allDents = {
                ...(overlayData?.dent_locations || {}),
                ...manualDents
            };

            const json = JSON.stringify({
                total_dents: Object.keys(allDents).length,
                dent_locations: allDents,
                dent_categories: Object.fromEntries(
                    Object.entries(DENT_CATEGORIES).map(([key, { label }]) => [key, label])
                )
            }, null, 2);

            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.json`;
            document.body.appendChild(a);
            a.click();

            // Clean up
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error saving annotation:', error);
            setError('Failed to save annotation. Please try again.');
        }
    };

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
            setShowInstructionModal(true);
        }
        setIsDrawingMode(!isDrawingMode);
        setIsEditMode(false);
        if (!isDrawingMode && !selectedCategory) {
            setSelectedCategory(Object.keys(DENT_CATEGORIES)[0]);
        }
    };

    const handleFinishDrawing = async () => {
        try {
            await saveAnnotationToAPI();
        } catch (error) {
            console.error("Error auto-saving annotation:", error);
        }
    };

    const saveAnnotationToAPI = async () => {
        try {
            const dentData = Object.values(manualDents).map(dent => ({
                center: { x: dent.center.x, y: dent.center.y },
                x_size: dent.x_size,
                y_size: dent.y_size,
                category: dent.category
            }));

            console.log(`Saving ${dentData.length} dents locally only`);

            if (isDrawingMode) {
                setIsDrawingMode(false);
            }

            return true;
        } catch (error) {
            console.error('Error saving annotation:', error);
            setError('Failed to save annotation. Please try again.');
            return false;
        }
    };



    const combinedDents = {
        ...(overlayData?.dent_locations || {}),
        ...manualDents
    };

    const dentCounts = Object.values(combinedDents).reduce((acc, dent) => {
        acc[dent.category] = (acc[dent.category] || 0) + 1;
        return acc;
    }, {});

    const totalDents = Object.values(dentCounts).reduce((sum, count) => sum + count, 0);

    const filteredDents = Object.entries(combinedDents)
        .filter(([_, dent]) => !filterCategory || dent.category === filterCategory);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Instructions Modal */}
            <InstructionModal
                isOpen={showInstructionModal}
                onClose={() => setShowInstructionModal(false)}
            />

            {/* Save Annotation Modal */}
            <SaveAnnotationModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onSave={(filename) => {
                    saveAnnotation(filename);
                    setShowSaveModal(false);
                }}
            />

            {/* Left Panel */}
            <div className="w-72 bg-white border-r border-gray-200 p-6 shadow-lg">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-2">Results Summary</h2>
                    <p className="text-3xl font-bold text-orange-600">{totalDents} Dents</p>
                </div>

                {selectedDent && combinedDents[selectedDent] && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Selected Dent</h2>
                        {isEditMode && selectedDent.startsWith('manual-') ? (
                            <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: DENT_CATEGORIES[combinedDents[selectedDent].category].color }}
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
                                            value={combinedDents[selectedDent].category}
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
                                                    value={Math.round(combinedDents[selectedDent].center.x)}
                                                    onChange={(e) => updateDent(selectedDent, 'center.x', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                            <div className="w-1/2">
                                                <label className="block text-xs text-gray-500">Y</label>
                                                <input
                                                    type="number"
                                                    value={Math.round(combinedDents[selectedDent].center.y)}
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
                                                    value={Math.round(combinedDents[selectedDent].x_size)}
                                                    onChange={(e) => updateDent(selectedDent, 'x_size', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                            <div className="w-1/2">
                                                <label className="block text-xs text-gray-500">Height</label>
                                                <input
                                                    type="number"
                                                    value={Math.round(combinedDents[selectedDent].y_size)}
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
                                dent={combinedDents[selectedDent]}
                                category={combinedDents[selectedDent].category}
                                dentId={selectedDent}
                                onEdit={handleEditDent}
                                onDelete={handleDeleteDent}
                            />
                        )}
                    </div>
                )}

                <div>
                    <h2 className="text-xl font-semibold mb-4">Categories</h2>

                    {filterCategory !== null && (
                        <button
                            className="flex items-center justify-center w-full p-2 mb-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 transition-all duration-200 border border-orange-200"
                            onClick={() => setFilterCategory(null)}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Reset Filter
                        </button>
                    )}

                    <div className="space-y-3">
                        {Object.entries(DENT_CATEGORIES).map(([key, { color, label }]) => (
                            <div
                                key={key}
                                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200
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
                    <div className="mt-8 space-y-3">
                        <button
                            onClick={() => setShowSaveModal(true)}
                            className="w-full flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-3 rounded-lg transition-colors duration-200 border border-orange-200"
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
                                onClick={() => fileInputRef.current.click()}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center gap-3 transition-colors duration-200 shadow-md"
                                disabled={isLoading}
                            >
                                <Upload className="w-5 h-5" />
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
                                        ? 'bg-orange-600 text-white hover:bg-orange-700'
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

                        {/* Drawing canvas layer */}
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
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg">
                                Upload an image to begin analysis
                            </div>
                        )}

                        {isLoading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <div className="bg-white rounded-lg p-6 shadow-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
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